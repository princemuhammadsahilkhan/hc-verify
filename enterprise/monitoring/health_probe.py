import os
import asyncio
import httpx
from fastapi import FastAPI, Response
from prometheus_client import Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST

app = FastAPI(title="HV Verify Health Probe Sidecar")

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")

# Prometheus Metrics
backend_up = Gauge('hvverify_backend_up', 'Is the backend reachable (1=yes, 0=no)')
backend_latency = Gauge('hvverify_backend_latency_seconds', 'Latency to backend / endpoint')
probe_checks_total = Counter('hvverify_probe_checks_total', 'Total number of health checks performed')

async def check_backend_health():
    probe_checks_total.inc()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{BACKEND_URL}/", timeout=5.0)
            if resp.status_code == 200:
                backend_up.set(1)
                backend_latency.set(resp.elapsed.total_seconds())
            else:
                backend_up.set(0)
    except Exception:
        backend_up.set(0)

@app.on_event("startup")
async def startup_event():
    # Background task to continuously poll the backend
    async def poll():
        while True:
            await check_backend_health()
            await asyncio.sleep(15)
    
    asyncio.create_task(poll())

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
