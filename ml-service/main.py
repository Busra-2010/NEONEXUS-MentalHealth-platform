"""
NEONEXUS ML Service — FastAPI application entry point.

Provides NLP intent classification and translation endpoints
for the NEONEXUS mental health chatbot platform.

Models loaded at startup:
  - XLM-RoBERTa (zero-shot classification, English + fallback)
  - MuRIL (zero-shot classification, Hindi & Urdu)
  - OPUS-MT (translation for Kashmiri & Dogri via pivot languages)
"""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.model_loader import (
    load_all_models,
    get_loaded_models,
    get_load_errors,
)
from routers import classify, translate, crisis

# ── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-32s  %(levelname)-7s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ml-service")


# ── Lifespan: load models once at startup ────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all ML models into memory before starting to serve requests."""
    logger.info("🚀 Starting NEONEXUS ML Service …")
    load_status = load_all_models()
    logger.info(f"📦 Model load status: {load_status}")
    yield
    logger.info("👋 Shutting down ML service")


# ── App ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NEONEXUS ML Service",
    description=(
        "NLP intent classification and translation microservice "
        "for the NEONEXUS mental health platform."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5000,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────
app.include_router(classify.router)
app.include_router(translate.router)
app.include_router(crisis.router)


# ── Health endpoint ──────────────────────────────────────────────────────
@app.get("/ml/health")
async def health_check():
    """Health check — returns loaded models and any load errors."""
    loaded = get_loaded_models()
    errors = get_load_errors()
    return {
        "status": "ok" if loaded else "degraded",
        "models_loaded": loaded,
        "models_failed": errors,
        "total_loaded": len(loaded),
        "total_failed": len(errors),
    }


@app.get("/")
async def root():
    return {
        "service": "NEONEXUS ML Service",
        "version": "1.0.0",
        "docs": "/docs",
    }
