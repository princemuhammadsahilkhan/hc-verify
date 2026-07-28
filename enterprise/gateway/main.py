import os
import httpx
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import StreamingResponse

app = FastAPI(title="HV Verify Enterprise Gateway")

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")

async def verify_cryptographic_signature(request: Request):
    # This is a stub for the enterprise signature verification.
    # In a real scenario, this checks X-Crypto-Signature header against the payload.
    # We will enforce this on specific sensitive routes.
    signature = request.headers.get("X-Crypto-Signature")
    if not signature:
        # For Phase 1 demonstration, we allow missing signatures but log it
        print("Warning: Missing cryptographic signature on sensitive route")
        # To strictly enforce:
        # raise HTTPException(status_code=403, detail="Missing cryptographic signature")
    return True

@app.middleware("http")
async def reverse_proxy_middleware(request: Request, call_next):
    path = request.url.path
    
    # Identify sensitive routes that require cryptographic validation
    sensitive_routes = ["/register", "/auth/me", "/vote"]
    
    if any(path.startswith(r) for r in sensitive_routes):
        await verify_cryptographic_signature(request)
        
    # Forward the request to the backend
    target_url = httpx.URL(f"{BACKEND_URL}{path}?{request.url.query}")
    
    client = httpx.AsyncClient(base_url=BACKEND_URL)
    
    # Read the body carefully to forward it
    body = await request.body()
    
    # Filter headers to avoid issues with host and content-length
    headers = dict(request.headers)
    headers.pop("host", None)
    
    try:
        response = await client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
            timeout=30.0
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Bad Gateway: {exc}")
        
    # Exclude certain headers from the response to avoid hop-by-hop issues
    excluded_headers = ["content-encoding", "content-length", "transfer-encoding", "connection"]
    response_headers = {k: v for k, v in response.headers.items() if k.lower() not in excluded_headers}
    
    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=response_headers,
        media_type=response.headers.get("content-type")
    )

@app.get("/gateway/health")
async def health_check():
    return {"status": "ok", "service": "enterprise-gateway"}
