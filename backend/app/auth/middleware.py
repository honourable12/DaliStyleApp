import time
import hashlib
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.sql import func
from cachetools import TTLCache

from app.database import SessionLocal
from app.wardrobe.models import ApiUsage, Partner, PartnerApiKey

logger = logging.getLogger(__name__)

RATE_LIMIT_STORE = {}
LIMIT_WINDOW = 60  # seconds
MAX_REQUESTS = 60  # per window

api_key_cache = TTLCache(maxsize=1000, ttl=300)


class ApiUsageMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if not path.startswith(("/style/engine", "/wardrobe/engine")):
            return await call_next(request)

        partner_key = request.headers.get("X-Partner-Key")
        if not partner_key:
            return await call_next(request)

        start_time = time.time()
        key_hash = hashlib.sha256(partner_key.encode()).hexdigest()

        cached_info = api_key_cache.get(key_hash)

        db = SessionLocal()
        try:
            if cached_info:
                partner_id, api_key_id = cached_info
            else:
                # DB Lookup
                api_key_record = (
                    db.query(PartnerApiKey)
                    .filter(PartnerApiKey.key_hash == key_hash, PartnerApiKey.is_active)
                    .first()
                )

                if not api_key_record:
                    return await call_next(request)

                partner = (
                    db.query(Partner)
                    .filter(Partner.id == api_key_record.partner_id, Partner.is_active)
                    .first()
                )

                if not partner:
                    return await call_next(request)

                partner_id, api_key_id = partner.id, api_key_record.id
                api_key_cache[key_hash] = (partner_id, api_key_id)

            # Rate Limiting Check
            p_id = str(partner_id)
            now = time.time()

            RATE_LIMIT_STORE[p_id] = [
                t for t in RATE_LIMIT_STORE.get(p_id, []) if now - t < LIMIT_WINDOW
            ]

            if len(RATE_LIMIT_STORE[p_id]) >= MAX_REQUESTS:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Rate limit exceeded. Max 60 requests per minute."
                    },
                )

            RATE_LIMIT_STORE[p_id].append(now)

            # Proceed to endpoint
            response = await call_next(request)
            process_time = int((time.time() - start_time) * 1000)

            usage = ApiUsage(
                partner_id=partner_id,
                api_key_id=api_key_id,
                endpoint=path,
                status_code=response.status_code,
                response_time_ms=process_time,
            )
            db.add(usage)

            # Efficiently update last used
            db.query(PartnerApiKey).filter(PartnerApiKey.id == api_key_id).update(
                {"last_used_at": func.now()}
            )
            db.commit()

            return response

        except Exception as e:
            logger.error(f"Middleware error: {e}")
            db.rollback()
        finally:
            db.close()

        return await call_next(request)
