"""
Language Router — selects the correct ML model pipeline based on language.

Routing rules:
  - "en"       → XLM-RoBERTa directly
  - "hi", "ur" → MuRIL directly
  - "ks"       → translate to English via OPUS-MT (ur→en pivot)
                  → classify with XLM-RoBERTa
  - "doi"      → translate to English via OPUS-MT (hi→en pivot)
                  → classify with XLM-RoBERTa
"""

import logging
from typing import Dict, Any, Optional
from services import xlm_roberta, muril, opus_mt

logger = logging.getLogger("ml-service.language_router")


def classify(message: str, language: str = "en") -> Dict[str, Any]:
    """
    Route a message to the correct classification model based on language.

    Args:
        message: User's message text.
        language: Language code ("en", "hi", "ur", "ks", "doi").

    Returns:
        {
            "intent": str,
            "confidence": float,
            "model_used": str,
            "translated_message": str | None  (only for ks/doi)
        }
    """

    # ── English: XLM-RoBERTa directly ────────────────────────────────
    if language == "en":
        result = xlm_roberta.classify(message)
        return {
            **result,
            "model_used": "xlm-roberta",
            "translated_message": None,
        }

    # ── Hindi / Urdu: MuRIL directly ─────────────────────────────────
    if language in ("hi", "ur"):
        result = muril.classify(message, language)

        # If MuRIL returns low confidence, fall back to XLM-RoBERTa
        # via English translation
        if result["confidence"] < 0.3:
            logger.info(
                f"MuRIL confidence too low ({result['confidence']}), "
                f"falling back to XLM-RoBERTa"
            )
            translated = opus_mt.translate_to_english(message, language)
            if translated:
                fallback = xlm_roberta.classify(translated)
                if fallback["confidence"] > result["confidence"]:
                    return {
                        **fallback,
                        "model_used": "xlm-roberta (via translation fallback)",
                        "translated_message": translated,
                    }

        return {
            **result,
            "model_used": "muril",
            "translated_message": None,
        }

    # ── Kashmiri / Dogri: translate → classify → (optionally translate back)
    if language in ("ks", "doi"):
        # Step 1: Translate to English
        translated = opus_mt.translate_to_english(message, language)

        if translated is None:
            logger.warning(
                f"Translation failed for {language}, "
                f"attempting XLM-RoBERTa on raw text"
            )
            # XLM-RoBERTa is cross-lingual; try raw text as last resort
            result = xlm_roberta.classify(message)
            return {
                **result,
                "model_used": "xlm-roberta (raw, no translation)",
                "translated_message": None,
            }

        # Step 2: Classify the English translation
        result = xlm_roberta.classify(translated)

        return {
            **result,
            "model_used": "xlm-roberta (via opus-mt translation)",
            "translated_message": translated,
        }

    # ── Unknown language: try XLM-RoBERTa as cross-lingual fallback ──
    logger.warning(f"Unknown language '{language}', using XLM-RoBERTa")
    result = xlm_roberta.classify(message)
    return {
        **result,
        "model_used": "xlm-roberta (unknown language fallback)",
        "translated_message": None,
    }
