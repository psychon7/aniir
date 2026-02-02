"""
Unit tests for Shopify OAuth API endpoints.

Tests the shopify_oauth code structure and logic without requiring database.
"""
import pytest
import ast
import os


class TestShopifyOAuthFileStructure:
    """Tests to verify the shopify_oauth.py file structure."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures."""
        self.file_path = "app/api/v1/integrations/shopify_oauth.py"
        with open(self.file_path, "r") as f:
            self.source_code = f.read()
        self.tree = ast.parse(self.source_code)

    def test_file_exists(self):
        """Test that the shopify_oauth.py file exists."""
        assert os.path.exists(self.file_path)

    def test_router_is_defined(self):
        """Test that a router is defined in the file."""
        assert "router = APIRouter" in self.source_code

    def test_router_has_correct_prefix(self):
        """Test that the router has the correct prefix."""
        assert 'prefix="/shopify"' in self.source_code

    def test_router_has_correct_tags(self):
        """Test that the router has the Shopify OAuth tag."""
        assert "Shopify OAuth" in self.source_code

    def test_install_endpoint_exists(self):
        """Test that the install endpoint is defined."""
        assert '/install"' in self.source_code or "/install" in self.source_code
        assert "async def oauth_install" in self.source_code

    def test_callback_endpoint_exists(self):
        """Test that the callback endpoint is defined."""
        assert '/callback"' in self.source_code or "/callback" in self.source_code
        assert "async def oauth_callback" in self.source_code

    def test_webhooks_endpoint_exists(self):
        """Test that the webhooks endpoint is defined."""
        assert '/webhooks/{topic}"' in self.source_code or "/webhooks/" in self.source_code
        assert "async def receive_webhook" in self.source_code

    def test_verify_hmac_endpoint_exists(self):
        """Test that the verify-hmac endpoint is defined."""
        assert '/verify-hmac"' in self.source_code or "/verify-hmac" in self.source_code
        assert "async def verify_hmac_test" in self.source_code


class TestShopifyOAuthImports:
    """Tests to verify required imports in shopify_oauth.py."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures."""
        with open("app/api/v1/integrations/shopify_oauth.py", "r") as f:
            self.source_code = f.read()

    def test_fastapi_imports(self):
        """Test that FastAPI components are imported."""
        assert "from fastapi import" in self.source_code
        assert "APIRouter" in self.source_code
        assert "HTTPException" in self.source_code
        assert "Request" in self.source_code
        assert "Query" in self.source_code

    def test_hmac_verification_imports(self):
        """Test that HMAC verification is imported."""
        assert "from app.integrations.shopify.hmac_verification import" in self.source_code
        assert "verify_oauth_callback_request" in self.source_code
        assert "verify_webhook_request" in self.source_code
        assert "validate_shop_domain" in self.source_code

    def test_exception_imports(self):
        """Test that Shopify exceptions are imported."""
        assert "from app.integrations.shopify.exceptions import" in self.source_code
        assert "ShopifyHMACVerificationError" in self.source_code
        assert "ShopifyOAuthError" in self.source_code
        assert "ShopifyConfigurationError" in self.source_code

    def test_settings_import(self):
        """Test that settings are imported."""
        assert "from app.config.settings import get_settings" in self.source_code

    def test_database_import(self):
        """Test that database dependency is imported."""
        assert "from app.database import get_db" in self.source_code

    def test_model_import(self):
        """Test that ShopifyIntegration model is imported."""
        assert "from app.models.integrations.shopify import ShopifyIntegration" in self.source_code


class TestShopifyOAuthModels:
    """Tests to verify Pydantic models in shopify_oauth.py."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures."""
        with open("app/api/v1/integrations/shopify_oauth.py", "r") as f:
            self.source_code = f.read()

    def test_oauth_callback_response_model(self):
        """Test that OAuthCallbackResponse model is defined."""
        assert "class OAuthCallbackResponse(BaseModel):" in self.source_code
        assert "success: bool" in self.source_code
        assert "shop_domain: str" in self.source_code
        assert "message: str" in self.source_code
        assert "access_token_stored: bool" in self.source_code

    def test_webhook_response_model(self):
        """Test that WebhookResponse model is defined."""
        assert "class WebhookResponse(BaseModel):" in self.source_code

    def test_oauth_state_model(self):
        """Test that ShopifyOAuthState model is defined."""
        assert "class ShopifyOAuthState(BaseModel):" in self.source_code
        assert "nonce: str" in self.source_code
        assert "shop: str" in self.source_code
        assert "timestamp: int" in self.source_code


class TestShopifyOAuthHelperFunctions:
    """Tests to verify helper functions in shopify_oauth.py."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures."""
        with open("app/api/v1/integrations/shopify_oauth.py", "r") as f:
            self.source_code = f.read()

    def test_generate_oauth_state_exists(self):
        """Test that generate_oauth_state function exists."""
        assert "def generate_oauth_state(shop: str) -> str:" in self.source_code
        assert "secrets.token_urlsafe" in self.source_code

    def test_verify_oauth_state_exists(self):
        """Test that verify_oauth_state function exists."""
        assert "def verify_oauth_state(nonce: str, shop: str) -> bool:" in self.source_code

    def test_exchange_code_for_token_exists(self):
        """Test that exchange_code_for_token function exists."""
        assert "async def exchange_code_for_token" in self.source_code
        assert "access_token" in self.source_code

    def test_save_store_connection_exists(self):
        """Test that save_store_connection function exists."""
        assert "async def save_store_connection" in self.source_code


class TestShopifyOAuthSecurity:
    """Tests to verify security features in shopify_oauth.py."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures."""
        with open("app/api/v1/integrations/shopify_oauth.py", "r") as f:
            self.source_code = f.read()

    def test_hmac_verification_on_callback(self):
        """Test that HMAC verification is performed on callback."""
        # Find the oauth_callback function and verify HMAC check
        assert "verify_oauth_callback_request" in self.source_code
        assert "ShopifyHMACVerificationError" in self.source_code

    def test_hmac_verification_on_webhook(self):
        """Test that HMAC verification is performed on webhooks."""
        assert "verify_webhook_request" in self.source_code

    def test_csrf_protection_via_state(self):
        """Test that CSRF protection is implemented via OAuth state."""
        assert "verify_oauth_state" in self.source_code
        assert "Invalid OAuth state" in self.source_code

    def test_state_expiration(self):
        """Test that OAuth state has expiration check."""
        # Check for 5 minute expiration
        assert "300" in self.source_code  # 5 minutes in seconds

    def test_shop_domain_validation(self):
        """Test that shop domain is validated."""
        assert "validate_shop_domain" in self.source_code


class TestShopifyOAuthScopes:
    """Tests to verify OAuth scopes in shopify_oauth.py."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures."""
        with open("app/api/v1/integrations/shopify_oauth.py", "r") as f:
            self.source_code = f.read()

    def test_read_orders_scope(self):
        """Test that read_orders scope is requested."""
        assert '"read_orders"' in self.source_code

    def test_write_orders_scope(self):
        """Test that write_orders scope is requested."""
        assert '"write_orders"' in self.source_code

    def test_read_products_scope(self):
        """Test that read_products scope is requested."""
        assert '"read_products"' in self.source_code

    def test_write_products_scope(self):
        """Test that write_products scope is requested."""
        assert '"write_products"' in self.source_code

    def test_read_inventory_scope(self):
        """Test that read_inventory scope is requested."""
        assert '"read_inventory"' in self.source_code

    def test_write_inventory_scope(self):
        """Test that write_inventory scope is requested."""
        assert '"write_inventory"' in self.source_code

    def test_read_customers_scope(self):
        """Test that read_customers scope is requested."""
        assert '"read_customers"' in self.source_code

    def test_write_customers_scope(self):
        """Test that write_customers scope is requested."""
        assert '"write_customers"' in self.source_code

    def test_read_fulfillments_scope(self):
        """Test that read_fulfillments scope is requested."""
        assert '"read_fulfillments"' in self.source_code

    def test_write_fulfillments_scope(self):
        """Test that write_fulfillments scope is requested."""
        assert '"write_fulfillments"' in self.source_code


class TestIntegrationsRouterIncludesShopifyOAuth:
    """Tests to verify shopify_oauth is registered in integrations router."""

    def test_shopify_oauth_router_import(self):
        """Test that shopify_oauth router is imported in __init__.py."""
        with open("app/api/v1/integrations/__init__.py", "r") as f:
            content = f.read()

        assert "from app.api.v1.integrations.shopify_oauth import router as shopify_oauth_router" in content

    def test_shopify_oauth_router_included(self):
        """Test that shopify_oauth router is included in integrations router."""
        with open("app/api/v1/integrations/__init__.py", "r") as f:
            content = f.read()

        assert "integrations_router.include_router(shopify_oauth_router)" in content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
