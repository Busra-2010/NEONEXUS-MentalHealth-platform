"""
/ml/crisis — Crisis detection endpoint.

Accepts a user message + language, optionally translates to English,
then runs mBERT / BART-MNLI zero-shot classification to detect
crisis indicators.

Translation rules:
    en        → classify directly
    hi, ur    → translate to English first (BART-MNLI is English-focused)
    ks        → translate via Urdu pivot → English → classify
    doi       → translate via Hindi pivot → English → classify
"""

import logging
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, List

from services.crisis_bert import analyze_crisis
from services.opus_mt import translate_to_english

logger = logging.getLogger("ml-service.routers.crisis")

router = APIRouter(prefix="/ml", tags=["crisis"])


# ── Request / Response schemas ───────────────────────────────────────────

class CrisisRequest(BaseModel):
    message: str = Field(
        ..., min_length=1, max_length=5000,
        description="User message to analyze for crisis indicators",
    )
    language: Literal["en", "hi", "ur", "ks", "doi"] = Field(
        default="en",
        description="Language code of the message",
    )


class CrisisResponse(BaseModel):
    crisisDetected: bool
    severity: Literal["none", "low", "medium", "high"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    triggers: List[str]
    translated_message: str | None = None
    latency_ms: float


# ── Endpoint ─────────────────────────────────────────────────────────────

@router.post("/crisis", response_model=CrisisResponse)
async def detect_crisis(req: CrisisRequest):
    """
    Detect crisis indicators in a user message using BERT-based
    zero-shot classification.

    Non-English messages are translated to English first via OPUS-MT
    before classification.
    """
    start = time.time()
    translated_message: str | None = None
    analysis_text = req.message

    # ── Step 1: Translate to English if needed ────────────────────────
    if req.language != "en":
        try:
            translated = translate_to_english(req.message, req.language)
            if translated:
                translated_message = translated
                analysis_text = translated
                logger.info(
                    f"Translated {req.language}→en for crisis analysis: "
                    f"'{req.message[:40]}…' → '{translated[:40]}…'"
                )
            else:
                logger.warning(
                    f"Translation {req.language}→en failed, "
                    f"analysing raw text with BART-MNLI"
                )
        except Exception as e:
            logger.warning(
                f"Translation error ({req.language}→en): {e}, "
                f"falling back to raw text"
            )

    # ── Step 2: Run crisis classification ─────────────────────────────
    try:
        result = analyze_crisis(analysis_text)
    except Exception as e:
        logger.error(f"Crisis analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Crisis analysis failed: {str(e)}",
        )

    latency_ms = round((time.time() - start) * 1000, 2)

    return CrisisResponse(
        crisisDetected=result["crisisDetected"],
        severity=result["severity"],
        confidence=result["confidence"],
        triggers=result["triggers"],
        translated_message=translated_message,
        latency_ms=latency_ms,
    )
