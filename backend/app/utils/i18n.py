"""
Internationalization (i18n) Utility Module

Provides translation support for the ERP system with:
- Multiple language support (French, English, German, Spanish, Italian)
- JSON-based translation files
- Fallback to default language
- Parameterized translations
- Locale detection from request headers
- Thread-safe translation loading
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, Optional, Union
from functools import lru_cache
from threading import Lock
import logging

from fastapi import Request, Depends
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Supported languages
SUPPORTED_LANGUAGES = {
    "fr": "Français",
    "en": "English",
    "de": "Deutsch",
    "es": "Español",
    "it": "Italiano",
}

DEFAULT_LANGUAGE = "fr"

# Translation cache and lock for thread safety
_translations_cache: Dict[str, Dict[str, Any]] = {}
_cache_lock = Lock()

# Base path for translation files
TRANSLATIONS_DIR = Path(__file__).parent.parent / "translations"


class TranslationNotFoundError(Exception):
    """Raised when a translation key is not found."""
    pass


def get_translations_dir() -> Path:
    """Get the translations directory path, creating it if necessary."""
    if not TRANSLATIONS_DIR.exists():
        TRANSLATIONS_DIR.mkdir(parents=True, exist_ok=True)
        # Create default translation files
        _create_default_translations()
    return TRANSLATIONS_DIR


def _create_default_translations() -> None:
    """Create default translation files if they don't exist."""
    default_translations = {
        "fr": {
            "common": {
                "save": "Enregistrer",
                "cancel": "Annuler",
                "delete": "Supprimer",
                "edit": "Modifier",
                "create": "Créer",
                "search": "Rechercher",
                "filter": "Filtrer",
                "export": "Exporter",
                "import": "Importer",
                "print": "Imprimer",
                "close": "Fermer",
                "confirm": "Confirmer",
                "yes": "Oui",
                "no": "Non",
                "loading": "Chargement...",
                "error": "Erreur",
                "success": "Succès",
                "warning": "Attention",
                "info": "Information",
                "required_field": "Ce champ est obligatoire",
                "invalid_format": "Format invalide",
                "no_results": "Aucun résultat",
                "page": "Page",
                "of": "sur",
                "items": "éléments",
                "actions": "Actions",
                "status": "Statut",
                "active": "Actif",
                "inactive": "Inactif",
                "date": "Date",
                "amount": "Montant",
                "total": "Total",
                "subtotal": "Sous-total",
                "tax": "TVA",
                "discount": "Remise",
            },
            "entities": {
                "client": "Client",
                "clients": "Clients",
                "supplier": "Fournisseur",
                "suppliers": "Fournisseurs",
                "product": "Produit",
                "products": "Produits",
                "quote": "Devis",
                "quotes": "Devis",
                "order": "Commande",
                "orders": "Commandes",
                "invoice": "Facture",
                "invoices": "Factures",
                "delivery": "Livraison",
                "deliveries": "Livraisons",
                "payment": "Paiement",
                "payments": "Paiements",
                "user": "Utilisateur",
                "users": "Utilisateurs",
            },
            "messages": {
                "created_success": "{entity} créé(e) avec succès",
                "updated_success": "{entity} mis(e) à jour avec succès",
                "deleted_success": "{entity} supprimé(e) avec succès",
                "not_found": "{entity} non trouvé(e)",
                "already_exists": "{entity} existe déjà",
                "validation_error": "Erreur de validation",
                "server_error": "Erreur serveur",
                "unauthorized": "Non autorisé",
                "forbidden": "Accès interdit",
                "confirm_delete": "Êtes-vous sûr de vouloir supprimer {entity} ?",
            },
            "fields": {
                "reference": "Référence",
                "name": "Nom",
                "description": "Description",
                "email": "Email",
                "phone": "Téléphone",
                "address": "Adresse",
                "city": "Ville",
                "postal_code": "Code postal",
                "country": "Pays",
                "vat_number": "Numéro TVA",
                "siret": "SIRET",
                "price": "Prix",
                "quantity": "Quantité",
                "unit": "Unité",
                "category": "Catégorie",
                "brand": "Marque",
                "currency": "Devise",
                "payment_term": "Conditions de paiement",
                "payment_mode": "Mode de paiement",
                "business_unit": "Business Unit",
                "society": "Société",
            },
            "validation": {
                "min_length": "Minimum {min} caractères requis",
                "max_length": "Maximum {max} caractères autorisés",
                "min_value": "Valeur minimum: {min}",
                "max_value": "Valeur maximum: {max}",
                "invalid_email": "Adresse email invalide",
                "invalid_phone": "Numéro de téléphone invalide",
                "invalid_vat": "Numéro TVA invalide",
                "positive_number": "La valeur doit être positive",
                "integer_required": "Un nombre entier est requis",
                "date_required": "Une date est requise",
                "future_date": "La date doit être dans le futur",
                "past_date": "La date doit être dans le passé",
            },
            "landed_cost": {
                "title": "Coût de revient",
                "purchase_price": "Prix d'achat",
                "transport_cost": "Frais de transport",
                "customs_duty": "Droits de douane",
                "insurance": "Assurance",
                "handling": "Manutention",
                "other_costs": "Autres frais",
                "total_landed_cost": "Coût de revient total",
                "margin": "Marge",
                "selling_price": "Prix de vente",
            },
        },
        "en": {
            "common": {
                "save": "Save",
                "cancel": "Cancel",
                "delete": "Delete",
                "edit": "Edit",
                "create": "Create",
                "search": "Search",
                "filter": "Filter",
                "export": "Export",
                "import": "Import",
                "print": "Print",
                "close": "Close",
                "confirm": "Confirm",
                "yes": "Yes",
                "no": "No",
                "loading": "Loading...",
                "error": "Error",
                "success": "Success",
                "warning": "Warning",
                "info": "Information",
                "required_field": "This field is required",
                "invalid_format": "Invalid format",
                "no_results": "No results",
                "page": "Page",
                "of": "of",
                "items": "items",
                "actions": "Actions",
                "status": "Status",
                "active": "Active",
                "inactive": "Inactive",
                "date": "Date",
                "amount": "Amount",
                "total": "Total",
                "subtotal": "Subtotal",
                "tax": "VAT",
                "discount": "Discount",
            },
            "entities": {
                "client": "Client",
                "clients": "Clients",
                "supplier": "Supplier",
                "suppliers": "Suppliers",
                "product": "Product",
                "products": "Products",
                "quote": "Quote",
                "quotes": "Quotes",
                "order": "Order",
                "orders": "Orders",
                "invoice": "Invoice",
                "invoices": "Invoices",
                "delivery": "Delivery",
                "deliveries": "Deliveries",
                "payment": "Payment",
                "payments": "Payments",
                "user": "User",
                "users": "Users",
            },
            "messages": {
                "created_success": "{entity} created successfully",
                "updated_success": "{entity} updated successfully",
                "deleted_success": "{entity} deleted successfully",
                "not_found": "{entity} not found",
                "already_exists": "{entity} already exists",
                "validation_error": "Validation error",
                "server_error": "Server error",
                "unauthorized": "Unauthorized",
                "forbidden": "Access forbidden",
                "confirm_delete": "Are you sure you want to delete {entity}?",
            },
            "fields": {
                "reference": "Reference",
                "name": "Name",
                "description": "Description",
                "email": "Email",
                "phone": "Phone",
                "address": "Address",
                "city": "City",
                "postal_code": "Postal Code",
                "country": "Country",
                "vat_number": "VAT Number",
                "siret": "SIRET",
                "price": "Price",
                "quantity": "Quantity",
                "unit": "Unit",
                "category": "Category",
                "brand": "Brand",
                "currency": "Currency",
                "payment_term": "Payment Terms",
                "payment_mode": "Payment Mode",
                "business_unit": "Business Unit",
                "society": "Company",
            },
            "validation": {
                "min_length": "Minimum {min} characters required",
                "max_length": "Maximum {max} characters allowed",
                "min_value": "Minimum value: {min}",
                "max_value": "Maximum value: {max}",
                "invalid_email": "Invalid email address",
                "invalid_phone": "Invalid phone number",
                "invalid_vat": "Invalid VAT number",
                "positive_number": "Value must be positive",
                "integer_required": "An integer is required",
                "date_required": "A date is required",
                "future_date": "Date must be in the future",
                "past_date": "Date must be in the past",
            },
            "landed_cost": {
                "title": "Landed Cost",
                "purchase_price": "Purchase Price",
                "transport_cost": "Transport Cost",
                "customs_duty": "Customs Duty",
                "insurance": "Insurance",
                "handling": "Handling",
                "other_costs": "Other Costs",
                "total_landed_cost": "Total Landed Cost",
                "margin": "Margin",
                "selling_price": "Selling Price",
            },
        },
    }
    
    for lang, translations in default_translations.items():
        file_path = TRANSLATIONS_DIR / f"{lang}.json"
        if not file_path.exists():
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(translations, f, ensure_ascii=False, indent=2)
            logger.info(f"Created default translation file: {file_path}")


def load_translations(language: str) -> Dict[str, Any]:
    """
    Load translations for a specific language.
    
    Args:
        language: Language code (e.g., 'fr', 'en')
        
    Returns:
        Dictionary of translations
    """
    with _cache_lock:
        if language in _translations_cache:
            return _translations_cache[language]
    
    translations_dir = get_translations_dir()
    file_path = translations_dir / f"{language}.json"
    
    if not file_path.exists():
        logger.warning(f"Translation file not found: {file_path}, falling back to {DEFAULT_LANGUAGE}")
        if language != DEFAULT_LANGUAGE:
            return load_translations(DEFAULT_LANGUAGE)
        return {}
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            translations = json.load(f)
        
        with _cache_lock:
            _translations_cache[language] = translations
        
        return translations
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing translation file {file_path}: {e}")
        if language != DEFAULT_LANGUAGE:
            return load_translations(DEFAULT_LANGUAGE)
        return {}


def clear_translations_cache() -> None:
    """Clear the translations cache (useful for reloading translations)."""
    with _cache_lock:
        _translations_cache.clear()
    logger.info("Translations cache cleared")


def get_nested_value(data: Dict[str, Any], key_path: str) -> Optional[str]:
    """
    Get a nested value from a dictionary using dot notation.
    
    Args:
        data: Dictionary to search
        key_path: Dot-separated key path (e.g., 'common.save')
        
    Returns:
        Value if found, None otherwise
    """
    keys = key_path.split(".")
    current = data
    
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return None
    
    return current if isinstance(current, str) else None


class Translator:
    """
    Translator class for handling translations with a specific language context.
    """
    
    def __init__(self, language: str = DEFAULT_LANGUAGE):
        """
        Initialize translator with a specific language.
        
        Args:
            language: Language code (e.g., 'fr', 'en')
        """
        self.language = language if language in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
        self._translations = load_translations(self.language)
        self._fallback_translations = (
            load_translations(DEFAULT_LANGUAGE) 
            if self.language != DEFAULT_LANGUAGE 
            else {}
        )
    
    def t(
        self, 
        key: str, 
        default: Optional[str] = None,
        **params: Any
    ) -> str:
        """
        Translate a key with optional parameters.
        
        Args:
            key: Translation key (dot notation, e.g., 'common.save')
            default: Default value if key not found
            **params: Parameters for string formatting
            
        Returns:
            Translated string
        """
        # Try to get translation from current language
        value = get_nested_value(self._translations, key)
        
        # Fallback to default language
        if value is None and self._fallback_translations:
            value = get_nested_value(self._fallback_translations, key)
        
        # Use default or key itself
        if value is None:
            value = default if default is not None else key
        
        # Apply parameters
        if params:
            try:
                value = value.format(**params)
            except KeyError as e:
                logger.warning(f"Missing parameter in translation '{key}': {e}")
        
        return value
    
    def translate(
        self, 
        key: str, 
        default: Optional[str] = None,
        **params: Any
    ) -> str:
        """Alias for t() method."""
        return self.t(key, default, **params)
    
    def get_all(self, namespace: Optional[str] = None) -> Dict[str, Any]:
        """
        Get all translations, optionally filtered by namespace.
        
        Args:
            namespace: Optional namespace to filter (e.g., 'common')
            
        Returns:
            Dictionary of translations
        """
        if namespace:
            return self._translations.get(namespace, {})
        return self._translations
    
    def has_key(self, key: str) -> bool:
        """Check if a translation key exists."""
        return get_nested_value(self._translations, key) is not None


def get_language_from_request(request: Request) -> str:
    """
    Extract preferred language from request headers.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Language code
    """
    # Check custom header first
    custom_lang = request.headers.get("X-Language")
    if custom_lang and custom_lang in SUPPORTED_LANGUAGES:
        return custom_lang
    
    # Check Accept-Language header
    accept_language = request.headers.get("Accept-Language", "")
    
    if accept_language:
        # Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en;q=0.8")
        languages = []
        for part in accept_language.split(","):
            part = part.strip()
            if ";q=" in part:
                lang, q = part.split(";q=")
                try:
                    quality = float(q)
                except ValueError:
                    quality = 0.0
            else:
                lang = part
                quality = 1.0
            
            # Extract base language code
            lang_code = lang.split("-")[0].lower()
            languages.append((lang_code, quality))
        
        # Sort by quality and find first supported language
        languages.sort(key=lambda x: x[1], reverse=True)
        for lang_code, _ in languages:
            if lang_code in SUPPORTED_LANGUAGES:
                return lang_code
    
    return DEFAULT_LANGUAGE


def get_translator(request: Request) -> Translator:
    """
    FastAPI dependency to get a translator based on request language.
    
    Usage:
        @router.get("/items")
        def get_items(t: Translator = Depends(get_translator)):
            return {"message": t.t("common.success")}
    """
    language = get_language_from_request(request)
    return Translator(language)


# Convenience function for quick translations
@lru_cache(maxsize=1000)
def translate(key: str, language: str = DEFAULT_LANGUAGE, **params: Any) -> str:
    """
    Quick translation function with caching.
    
    Args:
        key: Translation key
        language: Language code
        **params: Parameters for string formatting
        
    Returns:
        Translated string
    """
    translator = Translator(language)
    return translator.t(key, **params)


# Alias for translate function
_ = translate


class I18nMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add language context to requests.
    
    Adds 'language' attribute to request.state for use in route handlers.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Set language in request state
        request.state.language = get_language_from_request(request)
        response = await call_next(request)
        
        # Add Content-Language header to response
        response.headers["Content-Language"] = request.state.language
        
        return response


def get_supported_languages() -> Dict[str, str]:
    """Get dictionary of supported languages."""
    return SUPPORTED_LANGUAGES.copy()


def is_language_supported(language: str) -> bool:
    """Check if a language is supported."""
    return language in SUPPORTED_LANGUAGES


def format_message(
    message_key: str,
    entity_key: str,
    language: str = DEFAULT_LANGUAGE
) -> str:
    """
    Format a message with an entity name.
    
    Useful for messages like "Client created successfully".
    
    Args:
        message_key: Message key (e.g., 'messages.created_success')
        entity_key: Entity key (e.g., 'entities.client')
        language: Language code
        
    Returns:
        Formatted message
    """
    translator = Translator(language)
    entity_name = translator.t(entity_key)
    return translator.t(message_key, entity=entity_name)


# Export commonly used items
__all__ = [
    "Translator",
    "get_translator",
    "get_language_from_request",
    "translate",
    "_",
    "load_translations",
    "clear_translations_cache",
    "get_supported_languages",
    "is_language_supported",
    "format_message",
    "I18nMiddleware",
    "SUPPORTED_LANGUAGES",
    "DEFAULT_LANGUAGE",
    "TranslationNotFoundError",
]
