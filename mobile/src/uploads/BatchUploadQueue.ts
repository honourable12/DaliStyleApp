import { WardrobeItem, ClothingCategory, PatternType, PatternScale } from '../types';
import { EdgeAIPipeline } from '../ai/edgePipeline';
import { wardrobeStore } from '../db/storage';

export type UploadJobStatus = 'queued' | 'uploading' | 'processing' | 'done' | 'failed';

export interface UploadJob {
  id: string;
  localUri: string;
  name: string;
  status: UploadJobStatus;
  progress: number; // 0..1
  attempts: number;
  error?: string;
  result?: WardrobeItem;
}

type Listener = (jobs: UploadJob[]) => void;

const CONCURRENCY = 3;
const MAX_ATTEMPTS = 3;
const BACKEND_UPLOAD = 'http://10.0.2.2:8000/api/wardrobe/upload';

/**
 * BatchUploadQueue — a singleton that processes multiple garment uploads
 * with a bounded worker pool, per-job status, and automatic retry.
 *
 * Each job flows through:
 *   queued → uploading (backend POST) → processing (on-device edge AI)
 *         → done (added to wardrobeStore)
 *
 * Failures retry up to MAX_ATTEMPTS with exponential backoff, then surface
 * as `failed` for manual retry.
 */
class BatchUploadQueue {
  private jobs: UploadJob[] = [];
  private pendingIds: string[] = [];
  private activeCount = 0;
  private listeners: Set<Listener> = new Set();

  /** Called when a job completes and an item is added to the wardrobe. */
  onItemAdded?: (item: WardrobeItem) => void;

  getJobs(): UploadJob[] {
    return [...this.jobs];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getJobs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const snapshot = this.getJobs();
    this.listeners.forEach((l) => l(snapshot));
  }

  enqueue(uris: string[]): void {
    const now = Date.now();
    const newJobs: UploadJob[] = uris.map((uri, i) => ({
      id: `job-${now}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      localUri: uri,
      name: uri.split('/').pop()?.replace(/\.[^.]+$/, '') || `Piece ${i + 1}`,
      status: 'queued',
      progress: 0,
      attempts: 0,
    }));
    this.jobs = [...this.jobs, ...newJobs];
    this.pendingIds.push(...newJobs.map((j) => j.id));
    this.emit();
    this.pump();
  }

  retry(jobId: string): void {
    this.jobs = this.jobs.map((j) =>
      j.id === jobId
        ? { ...j, status: 'queued', error: undefined, progress: 0 }
        : j
    );
    if (!this.pendingIds.includes(jobId)) {
      this.pendingIds.push(jobId);
    }
    this.emit();
    this.pump();
  }

  retryAllFailed(): void {
    const failedIds: string[] = [];
    this.jobs = this.jobs.map((j) => {
      if (j.status === 'failed') {
        failedIds.push(j.id);
        return { ...j, status: 'queued', error: undefined, progress: 0 };
      }
      return j;
    });
    this.pendingIds.push(...failedIds.filter((id) => !this.pendingIds.includes(id)));
    this.emit();
    this.pump();
  }

  cancel(jobId: string): void {
    this.jobs = this.jobs.filter((j) => j.id !== jobId);
    this.pendingIds = this.pendingIds.filter((id) => id !== jobId);
    this.emit();
  }

  clearCompleted(): void {
    this.jobs = this.jobs.filter((j) => j.status !== 'done');
    this.emit();
  }

  clearAll(): void {
    this.jobs = [];
    this.pendingIds = [];
    this.emit();
  }

  private pump(): void {
    while (this.activeCount < CONCURRENCY && this.pendingIds.length > 0) {
      const id = this.pendingIds.shift()!;
      this.activeCount++;
      this.processJob(id).finally(() => {
        this.activeCount--;
        this.pump();
      });
    }
  }

  private updateJob(id: string, patch: Partial<UploadJob>) {
    this.jobs = this.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
    this.emit();
  }

  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return;

    const attempt = job.attempts + 1;
    this.updateJob(jobId, { status: 'uploading', progress: 0.1, attempts: attempt });

    try {
      // 1. Optional backend upload (only for local file:// or content:// URIs)
      let finalImageUrl = job.localUri;
      if (job.localUri.startsWith('file://') || job.localUri.startsWith('content://')) {
        try {
          const formData = new FormData();
          const filename = job.localUri.split('/').pop() || 'cloth.jpg';
          formData.append('file', {
            uri: job.localUri,
            name: filename,
            type: 'image/jpeg',
          } as any);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(BACKEND_UPLOAD, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (data.image_url) {
              finalImageUrl = `http://10.0.2.2:8000/static/${data.image_url}`;
            }
          }
        } catch {
          // Backend unreachable — fall back to local URI storage.
        }
      }

      this.updateJob(jobId, { status: 'processing', progress: 0.6 });

      // 2. On-device edge AI: extract color + suggest category and pattern
      let primaryHex = '#1A1917';
      let primaryName = 'Black';
      let category: ClothingCategory = 'top';
      let pattern: PatternType = 'solid';
      let patternScale: PatternScale = 'medium';
      try {
        const filename = job.localUri.split('/').pop() || '';
        const edgeResult = await EdgeAIPipeline.processGarment(job.localUri, 1.0, filename);
        primaryHex = edgeResult.primaryHex;
        primaryName = edgeResult.primaryName;
        category = edgeResult.suggestedCategory;
        if (edgeResult.pattern) pattern = edgeResult.pattern;
        if (edgeResult.patternScale) patternScale = edgeResult.patternScale;
      } catch {
        // defaults
      }

      this.updateJob(jobId, { progress: 0.9 });

      // 3. Build the wardrobe item and save
      const patternPrefix = pattern && pattern !== 'solid' ? `${pattern} ` : '';
      const newItem: WardrobeItem = {
        id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: `Tailored ${patternPrefix}${primaryName} ${category}`,
        category,
        primaryColor: primaryHex,
        primaryColorName: primaryName,
        pattern,
        patternScale,
        imageUrl: finalImageUrl,
        createdAt: Date.now(),
      };

      wardrobeStore.addItem(newItem);
      this.onItemAdded?.(newItem);

      this.updateJob(jobId, { status: 'done', progress: 1, result: newItem });
    } catch (err: any) {
      const message = String(err?.message || err);
      if (attempt < MAX_ATTEMPTS) {
        // Auto-retry with exponential backoff
        this.updateJob(jobId, { status: 'queued', error: message });
        const delay = Math.pow(2, attempt - 1) * 1000;
        setTimeout(() => {
          if (!this.pendingIds.includes(jobId)) {
            this.pendingIds.push(jobId);
          }
          this.pump();
        }, delay);
      } else {
        this.updateJob(jobId, { status: 'failed', error: message });
      }
    }
  }
}

export const batchUploadQueue = new BatchUploadQueue();
