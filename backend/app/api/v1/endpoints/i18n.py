"""
i18n API endpoints for translation management.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.utils.i18n import (
    Translator,
    get_translator,
    get_supported_languages,
    is_language_supported,
    load_translations,
    clear_translations_cache,
    DEFAULT_LANGUAGE,
)

router = APIRouter()


@router.get("/languages")
def list_supported_languages() -> Dict[str, Any]:
    """
    Get list of supported languages.
    
    Returns:
        Dictionary with supported languages and default language
    """
    return {
        "languages": get_supported_languages(),
        "default": DEFAULT_LANGUAGE,
    }


@router.get("/translations")
def get_translations(
    language: str = Query(DEFAULT_LANGUAGE, description="Language code"),
    namespace: Optional[str] = Query(None, description="Translation namespace (e.g., 'common', 'entities')"),
) -> Dict[str, Any]:
    """
    Get translations for a specific language.
    
    Args:
        language: Language code (fr, en, de, es, it)
        namespace: Optional namespace to filter translations
        
    Returns:
        Dictionary of translations
    """
    if not is_language_supported(language):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Language '{language}' is not supported. Supported: {list(get_supported_languages().keys())}"
        )
    
    translator = Translator(language)
    translations = translator.get_all(namespace)
    
    return {
        "language": language,
        "namespace": namespace,
        "translations": translations,
    }


@router.get("/translate")
def translate_key(
    key: str = Query(..., description="Translation key (dot notation)"),
    language: str = Query(DEFAULT_LANGUAGE, description="Language code"),
    t: Translator = Depends(get_translator),
) -> Dict[str, str]:
    """
    Translate a single key.
    
    Args:
        key: Translation key in dot notation (e.g., 'common.save')
        language: Language code
        
    Returns:
        Dictionary with key and translated value
    """
    # Use translator from request or create new one with specified language
    if language != t.language:
        t = Translator(language)
    
    return {
        "key": key,
        "language": t.language,
        "value": t.t(key),
    }


@router.post("/cache/clear")
def clear_cache() -> Dict[str, str]:
    """
    Clear the translations cache.
    
    Useful when translation files have been updated.
    
    Returns:
        Success message
    """
    clear_translations_cache()
    return {"message": "Translations cache cleared successfully"}


@router.get("/validate")
def validate_language(
    language: str = Query(..., description="Language code to validate"),
) -> Dict[str, Any]:
    """
    Validate if a language is supported.
    
    Args:
        language: Language code to validate
        
    Returns:
        Validation result
    """
    supported = is_language_supported(language)
    return {
        "language": language,
        "supported": supported,
        "message": f"Language '{language}' is {'supported' if supported else 'not supported'}",
    }
