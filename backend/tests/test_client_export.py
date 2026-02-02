"""
Test Client CSV Export functionality.
Tests the export_clients_csv method and the /export endpoint.
"""
import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock, AsyncMock, patch
from io import StringIO


class TestClientExportService:
    """Test suite for Client export service methods."""

    @pytest.mark.asyncio
    async def test_export_clients_csv_returns_csv_content(self, mock_db_session):
        """Test that export_clients_csv returns valid CSV content."""
        from app.services.client_service import ClientService
        from app.models.client import Client

        # Create mock client data
        mock_client = MagicMock(spec=Client)
        mock_client.cli_id = 1
        mock_client.cli_reference = 'CLI-20250131-0001'
        mock_client.cli_company_name = 'Test Company'
        mock_client.cli_first_name = 'John'
        mock_client.cli_last_name = 'Doe'
        mock_client.cli_email = 'john@test.com'
        mock_client.cli_phone = '+33123456789'
        mock_client.cli_mobile = '+33612345678'
        mock_client.cli_address = '123 Test Street'
        mock_client.cli_address2 = 'Suite 100'
        mock_client.cli_postal_code = '75001'
        mock_client.cli_city = 'Paris'
        mock_client.cli_country_id = 1
        mock_client.cli_vat_number = 'FR12345678901'
        mock_client.cli_siret = '12345678901234'
        mock_client.cli_website = 'https://test.com'
        mock_client.cli_type_id = 1
        mock_client.cli_sta_id = 1
        mock_client.cli_cur_id = 1
        mock_client.cli_pay_mode_id = 1
        mock_client.cli_pay_term_id = 1
        mock_client.cli_credit_limit = Decimal('10000.00')
        mock_client.cli_discount = Decimal('5.00')
        mock_client.cli_bu_id = 1
        mock_client.cli_soc_id = 1
        mock_client.cli_lang_id = 1
        mock_client.cli_notes = 'Test notes'
        mock_client.cli_is_active = True
        mock_client.cli_created_at = datetime(2025, 1, 31, 10, 0, 0)
        mock_client.cli_updated_at = datetime(2025, 1, 31, 12, 0, 0)

        # Mock list_clients to return our mock client
        service = ClientService(mock_db_session)
        with patch.object(service, 'list_clients', new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([mock_client], 1)

            csv_content, count = await service.export_clients_csv()

            # Verify count
            assert count == 1

            # Verify CSV content
            assert 'cli_id' in csv_content
            assert 'cli_reference' in csv_content
            assert 'cli_company_name' in csv_content
            assert 'Test Company' in csv_content
            assert 'john@test.com' in csv_content
            assert 'CLI-20250131-0001' in csv_content

    @pytest.mark.asyncio
    async def test_export_clients_csv_empty_result(self, mock_db_session):
        """Test export with no clients returns header only."""
        from app.services.client_service import ClientService

        service = ClientService(mock_db_session)
        with patch.object(service, 'list_clients', new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([], 0)

            csv_content, count = await service.export_clients_csv()

            # Should have header row
            assert count == 0
            assert 'cli_id' in csv_content
            assert 'cli_company_name' in csv_content

    @pytest.mark.asyncio
    async def test_export_clients_csv_handles_none_values(self, mock_db_session):
        """Test export properly handles None values."""
        from app.services.client_service import ClientService
        from app.models.client import Client

        mock_client = MagicMock(spec=Client)
        mock_client.cli_id = 1
        mock_client.cli_reference = 'CLI-20250131-0001'
        mock_client.cli_company_name = 'Test Company'
        mock_client.cli_first_name = None
        mock_client.cli_last_name = None
        mock_client.cli_email = None
        mock_client.cli_phone = None
        mock_client.cli_mobile = None
        mock_client.cli_address = None
        mock_client.cli_address2 = None
        mock_client.cli_postal_code = None
        mock_client.cli_city = None
        mock_client.cli_country_id = None
        mock_client.cli_vat_number = None
        mock_client.cli_siret = None
        mock_client.cli_website = None
        mock_client.cli_type_id = None
        mock_client.cli_sta_id = 1
        mock_client.cli_cur_id = None
        mock_client.cli_pay_mode_id = None
        mock_client.cli_pay_term_id = None
        mock_client.cli_credit_limit = None
        mock_client.cli_discount = None
        mock_client.cli_bu_id = None
        mock_client.cli_soc_id = None
        mock_client.cli_lang_id = None
        mock_client.cli_notes = None
        mock_client.cli_is_active = True
        mock_client.cli_created_at = None
        mock_client.cli_updated_at = None

        service = ClientService(mock_db_session)
        with patch.object(service, 'list_clients', new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([mock_client], 1)

            # Should not raise an exception
            csv_content, count = await service.export_clients_csv()

            assert count == 1
            assert 'Test Company' in csv_content

    @pytest.mark.asyncio
    async def test_export_clients_csv_with_search_params(self, mock_db_session):
        """Test export with search parameters passes them to list_clients."""
        from app.services.client_service import ClientService
        from app.schemas.client import ClientSearchParams

        search_params = ClientSearchParams(
            search='Test',
            is_active=True,
            status_id=1
        )

        service = ClientService(mock_db_session)
        with patch.object(service, 'list_clients', new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([], 0)

            await service.export_clients_csv(search_params)

            # Verify search params were passed
            mock_list.assert_called_once()
            call_args = mock_list.call_args
            assert call_args[1]['search_params'] == search_params
            assert call_args[1]['skip'] == 0
            assert call_args[1]['limit'] == 10000  # Export limit

    @pytest.mark.asyncio
    async def test_export_clients_csv_correct_column_order(self, mock_db_session):
        """Test that CSV columns are in the expected order."""
        from app.services.client_service import ClientService
        from app.models.client import Client

        mock_client = MagicMock(spec=Client)
        mock_client.cli_id = 1
        mock_client.cli_reference = 'REF001'
        mock_client.cli_company_name = 'Company'
        mock_client.cli_first_name = 'First'
        mock_client.cli_last_name = 'Last'
        mock_client.cli_email = 'email@test.com'
        mock_client.cli_phone = '123'
        mock_client.cli_mobile = '456'
        mock_client.cli_address = 'Addr'
        mock_client.cli_address2 = 'Addr2'
        mock_client.cli_postal_code = '12345'
        mock_client.cli_city = 'City'
        mock_client.cli_country_id = 1
        mock_client.cli_vat_number = 'VAT'
        mock_client.cli_siret = 'SIRET'
        mock_client.cli_website = 'web'
        mock_client.cli_type_id = 1
        mock_client.cli_sta_id = 1
        mock_client.cli_cur_id = 1
        mock_client.cli_pay_mode_id = 1
        mock_client.cli_pay_term_id = 1
        mock_client.cli_credit_limit = Decimal('1000')
        mock_client.cli_discount = Decimal('10')
        mock_client.cli_bu_id = 1
        mock_client.cli_soc_id = 1
        mock_client.cli_lang_id = 1
        mock_client.cli_notes = 'Notes'
        mock_client.cli_is_active = True
        mock_client.cli_created_at = datetime.now()
        mock_client.cli_updated_at = datetime.now()

        service = ClientService(mock_db_session)
        with patch.object(service, 'list_clients', new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([mock_client], 1)

            csv_content, _ = await service.export_clients_csv()

            lines = csv_content.strip().split('\n')
            header = lines[0]
            columns = header.split(',')

            # Verify first few columns are in expected order
            assert columns[0] == 'cli_id'
            assert columns[1] == 'cli_reference'
            assert columns[2] == 'cli_company_name'


class TestClientExportEndpoint:
    """Test suite for Client export API endpoint."""

    def test_export_endpoint_exists(self):
        """Test that export endpoint is registered."""
        from app.api.v1.clients import router

        routes = [route.path for route in router.routes]
        # Router has prefix /clients, so the full path is /clients/export
        assert '/clients/export' in routes

    def test_export_endpoint_method(self):
        """Test that export endpoint uses GET method."""
        from app.api.v1.clients import router

        for route in router.routes:
            if route.path == '/export':
                assert 'GET' in route.methods

    def test_export_function_signature(self):
        """Test that export endpoint function has correct parameters."""
        from app.api.v1.clients import export_clients_csv
        import inspect

        sig = inspect.signature(export_clients_csv)
        params = list(sig.parameters.keys())

        # Should have filter parameters
        assert 'search' in params
        assert 'status_id' in params
        assert 'client_type_id' in params
        assert 'country_id' in params
        assert 'business_unit_id' in params
        assert 'society_id' in params
        assert 'is_active' in params
        assert 'service' in params


class TestCSVFormat:
    """Test CSV format validation."""

    @pytest.mark.asyncio
    async def test_csv_uses_comma_delimiter(self, mock_db_session):
        """Test that CSV uses comma as delimiter."""
        from app.services.client_service import ClientService
        from app.models.client import Client

        mock_client = MagicMock(spec=Client)
        mock_client.cli_id = 1
        mock_client.cli_reference = 'REF'
        mock_client.cli_company_name = 'Company'
        mock_client.cli_first_name = 'First'
        mock_client.cli_last_name = 'Last'
        mock_client.cli_email = 'a@b.com'
        mock_client.cli_phone = '123'
        mock_client.cli_mobile = '456'
        mock_client.cli_address = 'Addr'
        mock_client.cli_address2 = ''
        mock_client.cli_postal_code = '12345'
        mock_client.cli_city = 'City'
        mock_client.cli_country_id = 1
        mock_client.cli_vat_number = ''
        mock_client.cli_siret = ''
        mock_client.cli_website = ''
        mock_client.cli_type_id = 1
        mock_client.cli_sta_id = 1
        mock_client.cli_cur_id = 1
        mock_client.cli_pay_mode_id = 1
        mock_client.cli_pay_term_id = 1
        mock_client.cli_credit_limit = None
        mock_client.cli_discount = None
        mock_client.cli_bu_id = 1
        mock_client.cli_soc_id = 1
        mock_client.cli_lang_id = 1
        mock_client.cli_notes = ''
        mock_client.cli_is_active = True
        mock_client.cli_created_at = datetime.now()
        mock_client.cli_updated_at = None

        service = ClientService(mock_db_session)
        with patch.object(service, 'list_clients', new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([mock_client], 1)

            csv_content, _ = await service.export_clients_csv()

            # Check that lines contain commas (CSV delimiter)
            lines = csv_content.strip().split('\n')
            for line in lines:
                assert ',' in line

    @pytest.mark.asyncio
    async def test_csv_has_header_row(self, mock_db_session):
        """Test that CSV has a header row."""
        from app.services.client_service import ClientService

        service = ClientService(mock_db_session)
        with patch.object(service, 'list_clients', new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([], 0)

            csv_content, _ = await service.export_clients_csv()

            lines = csv_content.strip().split('\n')
            # Even with no data, should have header
            assert len(lines) >= 1
            header = lines[0]
            assert 'cli_id' in header

    @pytest.mark.asyncio
    async def test_csv_boolean_formatting(self, mock_db_session):
        """Test that boolean values are formatted correctly."""
        from app.services.client_service import ClientService
        from app.models.client import Client

        mock_client = MagicMock(spec=Client)
        mock_client.cli_id = 1
        mock_client.cli_reference = 'REF'
        mock_client.cli_company_name = 'Company'
        mock_client.cli_first_name = ''
        mock_client.cli_last_name = ''
        mock_client.cli_email = ''
        mock_client.cli_phone = ''
        mock_client.cli_mobile = ''
        mock_client.cli_address = ''
        mock_client.cli_address2 = ''
        mock_client.cli_postal_code = ''
        mock_client.cli_city = ''
        mock_client.cli_country_id = None
        mock_client.cli_vat_number = ''
        mock_client.cli_siret = ''
        mock_client.cli_website = ''
        mock_client.cli_type_id = None
        mock_client.cli_sta_id = 1
        mock_client.cli_cur_id = None
        mock_client.cli_pay_mode_id = None
        mock_client.cli_pay_term_id = None
        mock_client.cli_credit_limit = None
        mock_client.cli_discount = None
        mock_client.cli_bu_id = None
        mock_client.cli_soc_id = None
        mock_client.cli_lang_id = None
        mock_client.cli_notes = ''
        mock_client.cli_is_active = True
        mock_client.cli_created_at = datetime.now()
        mock_client.cli_updated_at = None

        service = ClientService(mock_db_session)
        with patch.object(service, 'list_clients', new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([mock_client], 1)

            csv_content, _ = await service.export_clients_csv()

            # Boolean should be lowercase 'true' or 'false'
            assert 'true' in csv_content or 'false' in csv_content
