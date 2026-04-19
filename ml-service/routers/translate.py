"""
/ml/translate — Text translation endpoint.

Uses OPUS-MT models for translation between supported language pairs.
Kashmiri maps to Urdu, Dogri maps to Hindi as pivot languages.
"""

import logging
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from services.opus_mt import translate

logger = logging.getLogger("ml-service.routers.translate")

router = APIRouter(prefix="/ml", tags=["translate"])


class TranslateRequest(BaseModel):
    text: str = Field(
        ..., min_length=1, max_length=5000,
        description="Text to translate"
    )
    source_lang: Literal["en", "hi", "ur", "ks", "doi"] = Field(
        ..., alias="sourceLang",
        description="Source language code"
    )
    target_lang: Literal["en", "hi", "ur", "ks", "doi"] = Field(
        ..., alias="targetLang",
        description="Target language code"
    )

    class Config:
        populate_by_name = True


class TranslateResponse(BaseModel):
    translated_text: str = Field(..., alias="translatedText")
    model_used: str
    latency_ms: float

    class Config:
        populate_by_name = True


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(req: TranslateRequest):
    """
    Translate text between supported languages using OPUS-MT.

    Supported pairs: en↔hi, en↔ur (ks routes through ur, doi through hi).
    """
    start = time.time()

    if req.source_lang == req.target_lang:
        return TranslateResponse(
            translatedText=req.text,
            model_used="passthrough (same language)",
            latency_ms=0.0,
        )

    try:
        result = translate(req.text, req.source_lang, req.target_lang)
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )

    if result is None:
        raise HTTPException(
            status_code=503,
            detail=f"Translation model for {req.source_lang}→{req.target_lang} "
                   f"is not available"
        )

    latency_ms = round((time.time() - start) * 1000, 2)

    # Determine the actual model used (with pivot resolution)
    from services.opus_mt import PIVOT_MAP
    actual_src = PIVOT_MAP.get(req.source_lang, req.source_lang)
    actual_tgt = PIVOT_MAP.get(req.target_lang, req.target_lang)
    model_key = f"Helsinki-NLP/opus-mt-{actual_src}-{actual_tgt}"

    return TranslateResponse(
        translatedText=result,
        model_used=model_key,
        latency_ms=latency_ms,
    )
