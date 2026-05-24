import time
import hashlib
from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.sql import func

from app.database import SessionLocal
from app.wardrobe.models import ApiUsage, Partner, PartnerApiKey

# Simple in-memory rate limiting store
RATE_LIMIT_STORE = {}
LIMIT_WINDOW = 60  # seconds
MAX_REQUESTS = 60  # per window


class ApiUsageMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if not path.startswith(("/style/engine", "/wardrobe/engine")):
            return await call_next(request)

        partner_key = request.headers.get("X-Partner-Key")
        if not partner_key:
            return await call_next(request)

        start_time = time.time()

        # Rate Limiting Check
        db = SessionLocal()
        try:
            # Hash the key for lookup
            key_hash = hashlib.sha256(partner_key.encode()).hexdigest()
            api_key_record = db.query(PartnerApiKey).filter(
                PartnerApiKey.key_hash == key_hash,
                PartnerApiKey.is_active
            ).first()

            if api_key_record:
                partner = db.query(Partner).filter(
                    Partner.id == api_key_record.partner_id,
                    Partner.is_active
                ).first()

                if partner:
                    p_id = str(partner.id)
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

                    response = await call_next(request)
                    process_time = int((time.time() - start_time) * 1000)

                    # Log Usage
                    usage = ApiUsage(
                        partner_id=partner.id,
                        api_key_id=api_key_record.id,
                        endpoint=path,
                        status_code=response.status_code,
                        response_time_ms=process_time,
                    )
                    db.add(usage)
                    
                    api_key_record.last_used_at = func.now()
                    db.add(api_key_record)
                        
                    db.commit()
                    return response

        except Exception as e:
            print(f"Middleware error: {e}")
        finally:
            db.close()

        return await call_next(request)
