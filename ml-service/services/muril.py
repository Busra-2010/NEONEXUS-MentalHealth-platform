"""
MuRIL Service — zero-shot intent classification for Hindi & Urdu text.

Uses google/muril-base-cased via HuggingFace pipeline.
MuRIL (Multilingual Representations for Indian Languages) is specifically
designed for Indian languages including Hindi, Urdu, Bengali, Tamil, etc.
"""

import logging
from typing import Dict
from models.model_loader import get_model, INTENT_LABELS

logger = logging.getLogger("ml-service.muril")

# Hindi/Urdu hypothesis templates for better zero-shot performance
HYPOTHESIS_TEMPLATES = {
    "hi": "यह पाठ {} के बारे में है।",
    "ur": "یہ متن {} کے بارے میں ہے۔",
}


def classify(text: str, language: str = "hi") -> Dict[str, any]:
    """
    Classify Hindi or Urdu text into one of the defined intents.

    Args:
        text: The user message in Hindi or Urdu.
        language: "hi" or "ur"

    Returns:
        { "intent": str, "confidence": float }
        Returns intent="unknown" with confidence=0.0 if model unavailable.
    """
    pipe = get_model("muril")

    if pipe is None:
        logger.warning("MuRIL not loaded — returning unknown")
        return {"intent": "unknown", "confidence": 0.0}

    try:
        # Use the English template as default — MuRIL handles
        # cross-lingual transfer well with English NLI prompts
        template = HYPOTHESIS_TEMPLATES.get(
            language, "This text is about {}."
        )

        result = pipe(
            text,
            candidate_labels=INTENT_LABELS,
            hypothesis_template=template,
        )

        intent = result["labels"][0]
        confidence = round(float(result["scores"][0]), 4)

        logger.debug(
            f"MuRIL [{language}]: '{text[:50]}…' → {intent} ({confidence})"
        )
        return {"intent": intent, "confidence": confidence}

    except Exception as e:
        logger.error(f"MuRIL inference error: {e}")
        return {"intent": "unknown", "confidence": 0.0}
