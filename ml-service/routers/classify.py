"""
/ml/classify — Intent classification endpoint.

Routes the message to the correct ML model based on language,
returns the classified intent with confidence score.
"""

import logging
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from services.language_router import classify

logger = logging.getLogger("ml-service.routers.classify")

router = APIRouter(prefix="/ml", tags=["classify"])


class ClassifyRequest(BaseModel):
    message: str = Field(
        ..., min_length=1, max_length=2000,
        description="User message to classify"
    )
    language: Literal["en", "hi", "ur", "ks", "doi"] = Field(
        default="en",
        description="Language code of the message"
    )


class ClassifyResponse(BaseModel):
    intent: str
    confidence: float
    translated_message: Optional[str] = None
    model_used: str
    latency_ms: float


@router.post("/classify", response_model=ClassifyResponse)
async def classify_intent(req: ClassifyRequest):
    """
    Classify a user message into a mental health intent.

    The model used depends on the input language:
    - en: XLM-RoBERTa
    - hi/ur: MuRIL
    - ks/doi: OPUS-MT translation → XLM-RoBERTa
    """
    start = time.time()

    try:
        result = classify(req.message, req.language)
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Classification failed: {str(e)}"
        )

    latency_ms = round((time.time() - start) * 1000, 2)

    return ClassifyResponse(
        intent=result["intent"],
        confidence=result["confidence"],
        translated_message=result.get("translated_message"),
        model_used=result["model_used"],
        latency_ms=latency_ms,
    )
