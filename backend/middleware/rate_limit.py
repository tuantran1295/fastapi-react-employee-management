"""
Rate limiting middleware using standard library only.
"""
import time
from typing import Dict, Tuple
from fastapi import HTTPException
from config import RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_MAX_REQUESTS

_rate_limit_state: Dict[str, Tuple[float, int]] = {}


def check_rate_limit(client_key: str) -> None:
    """
    Naive fixed-window rate limiter implemented with only the standard library.
    
    Limits each client (by IP + org) to RATE_LIMIT_MAX_REQUESTS per RATE_LIMIT_WINDOW_SECONDS.
    Raises HTTPException(429) when the limit is exceeded.
    
    Args:
        client_key: Unique key identifying the client (format: "ip:org:endpoint")
    
    Raises:
        HTTPException: 429 status code when rate limit is exceeded
    """
    now = time.time()
    window_start, count = _rate_limit_state.get(client_key, (now, 0))

    if now - window_start >= RATE_LIMIT_WINDOW_SECONDS:
        window_start = now
        count = 0

    count += 1
    _rate_limit_state[client_key] = (window_start, count)

    if count > RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

