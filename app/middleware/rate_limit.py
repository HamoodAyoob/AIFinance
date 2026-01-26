"""
Rate limiting middleware for FastAPI.
Uses in-memory storage for simple rate limiting.
"""

import time
from collections import defaultdict, deque
from typing import Dict, Deque
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple rate limiting middleware using in-memory storage.
    Limits requests per client IP address.
    """

    def __init__(self, app, calls: int = 100, period: int = 60):
        """
        Initialize rate limiting middleware.

        Args:
            app: FastAPI app instance
            calls: Number of allowed requests per period
            period: Time period in seconds
        """
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients: Dict[str, Deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting."""
        # Get client IP
        client_ip = self._get_client_ip(request)

        # Check rate limit
        if not self._is_allowed(client_ip):
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {self.calls} requests per {self.period} seconds.",
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        remaining = self._get_remaining_requests(client_ip)
        response.headers["X-RateLimit-Limit"] = str(self.calls)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + self.period))

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address from request."""
        # Check for forwarded IP first
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    def _is_allowed(self, client_ip: str) -> bool:
        """Check if client is allowed to make request."""
        now = time.time()
        client_requests = self.clients[client_ip]

        # Remove old requests outside the time window
        while client_requests and client_requests[0] <= now - self.period:
            client_requests.popleft()

        # Check if under limit
        if len(client_requests) >= self.calls:
            return False

        # Add current request
        client_requests.append(now)
        return True

    def _get_remaining_requests(self, client_ip: str) -> int:
        """Get remaining requests for client."""
        now = time.time()
        client_requests = self.clients[client_ip]

        # Remove old requests outside the time window
        while client_requests and client_requests[0] <= now - self.period:
            client_requests.popleft()

        return max(0, self.calls - len(client_requests))


# Global rate limiter instance
rate_limiter = RateLimitMiddleware(
    None,  # Will be set when added to app
    calls=settings.API_RATE_LIMIT,
    period=settings.API_RATE_LIMIT_PERIOD,
)
