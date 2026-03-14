from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("zenith")

SAFE_MESSAGES = {
    400: "Invalid request data.",
    401: "Authentication required.",
    403: "You don't have permission to do that.",
    404: "Resource not found.",
    409: "A conflict occurred — this record may already exist.",
    422: "Validation failed — check your request format.",
    429: "Too many requests — slow down.",
    500: "Something went wrong on our end.",
}

def _is_sensitive(detail: str) -> bool:
    keywords = ["supabase", "postgres", "sql", "column", "relation",
                "schema", "table", "constraint", "key", "traceback",
                "exception", "stack", "internal"]
    detail_lower = detail.lower()
    return any(k in detail_lower for k in keywords)


async def safe_http_exception_handler(request: Request, exc) -> JSONResponse:
    detail = str(exc.detail) if hasattr(exc, 'detail') else str(exc)

    if _is_sensitive(detail):
        logger.error(f"Suppressed sensitive error [{exc.status_code}]: {detail}")
        safe_detail = SAFE_MESSAGES.get(exc.status_code, SAFE_MESSAGES[500])
    else:
        safe_detail = detail

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": safe_detail},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(f"Unhandled exception on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": SAFE_MESSAGES[500]},
    )