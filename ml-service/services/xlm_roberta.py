"""
XLM-RoBERTa Service — zero-shot intent classification for English text.

Uses the joeddav/xlm-roberta-large-xnli model via HuggingFace pipeline.
Can be swapped with a fine-tuned checkpoint by changing the model name
in model_loader.py.
"""

import logging
from typing import Dict
from models.model_loader import get_model, INTENT_LABELS

logger = logging.getLogger("ml-service.xlm_roberta")


def classify(text: str) -> Dict[str, any]:
    """
    Classify English text into one of the defined intents.

    Args:
        text: The user message in English.

    Returns:
        { "intent": str, "confidence": float }
        Returns intent="unknown" with confidence=0.0 if model unavailable.
    """
    pipe = get_model("xlm-roberta")

    if pipe is None:
        logger.warning("XLM-RoBERTa not loaded — returning unknown")
        return {"intent": "unknown", "confidence": 0.0}

    try:
        result = pipe(
            text,
            candidate_labels=INTENT_LABELS,
            hypothesis_template="This text is about {}.",
        )

        # result.labels[0] is the top label, result.scores[0] is its score
        intent = result["labels"][0]
        confidence = round(float(result["scores"][0]), 4)

        logger.debug(f"XLM-RoBERTa: '{text[:50]}…' → {intent} ({confidence})")
        return {"intent": intent, "confidence": confidence}

    except Exception as e:
        logger.error(f"XLM-RoBERTa inference error: {e}")
        return {"intent": "unknown", "confidence": 0.0}
