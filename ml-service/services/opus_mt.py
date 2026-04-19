"""
OPUS-MT Service — translation between languages using Helsinki-NLP models.

Supported routes:
  - ur ↔ en  (Urdu ↔ English, also used as Kashmiri proxy)
  - hi ↔ en  (Hindi ↔ English, also used as Dogri proxy)

For Kashmiri (ks) and Dogri (doi), we route through pivot languages:
  - ks → treat as Urdu script → translate ur→en
  - doi → treat as Hindi script → translate hi→en
"""

import logging
from typing import Optional
from models.model_loader import get_model

logger = logging.getLogger("ml-service.opus_mt")

# Map unsupported languages to their closest supported pivot
PIVOT_MAP = {
    "ks": "ur",   # Kashmiri → Urdu (shared Nastaliq script)
    "doi": "hi",  # Dogri → Hindi (shared Devanagari script)
}


def translate(
    text: str, source_lang: str, target_lang: str
) -> Optional[str]:
    """
    Translate text between languages using OPUS-MT.

    Args:
        text: Input text to translate.
        source_lang: Source language code (en, hi, ur, ks, doi).
        target_lang: Target language code.

    Returns:
        Translated text string, or None if translation fails.
    """
    # Resolve pivots for unsupported languages
    actual_src = PIVOT_MAP.get(source_lang, source_lang)
    actual_tgt = PIVOT_MAP.get(target_lang, target_lang)

    model_key = f"opus-mt-{actual_src}-{actual_tgt}"
    pipe = get_model(model_key)

    if pipe is None:
        logger.warning(
            f"OPUS-MT model '{model_key}' not loaded — cannot translate "
            f"{source_lang}→{target_lang}"
        )
        return None

    try:
        result = pipe(text, max_length=512)
        translated = result[0]["translation_text"]

        logger.debug(
            f"OPUS-MT [{source_lang}→{target_lang} via {model_key}]: "
            f"'{text[:40]}…' → '{translated[:40]}…'"
        )
        return translated

    except Exception as e:
        logger.error(f"OPUS-MT translation error ({model_key}): {e}")
        return None


def translate_to_english(text: str, source_lang: str) -> Optional[str]:
    """Convenience: translate any supported language to English."""
    return translate(text, source_lang, "en")


def translate_from_english(text: str, target_lang: str) -> Optional[str]:
    """Convenience: translate English to any supported language."""
    return translate(text, "en", target_lang)
