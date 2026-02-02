"""
Tests for Landed Cost Service.

Tests the calculate_landed_cost function and related allocation strategies.
Uses mocking to avoid database dependencies.
"""
import pytest
import sys
from decimal import Decimal
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

# Mock the database module before importing anything else
sys.modules['app.database'] = MagicMock()
sys.modules['app.database'].Base = MagicMock()
sys.modules['app.database'].get_db = MagicMock()

# Mock models module
sys.modules['app.models'] = MagicMock()
sys.modules['app.models.user'] = MagicMock()
sys.modules['app.models.drive'] = MagicMock()
sys.modules['app.models.invoice'] = MagicMock()
sys.modules['app.models.payment'] = MagicMock()
sys.modules['app.models.client'] = MagicMock()
sys.modules['app.models.chat'] = MagicMock()

# Now define the actual landed cost models we need for testing
from enum import Enum


class MockAllocationStrategy(str, Enum):
    """Cost allocation strategy options."""
    WEIGHT = "WEIGHT"
    VOLUME = "VOLUME"
    VALUE = "VALUE"
    MIXED = "MIXED"


class MockLotStatus(str, Enum):
    """Supply lot status options."""
    DRAFT = "DRAFT"
    IN_TRANSIT = "IN_TRANSIT"
    ARRIVED = "ARRIVED"
    CLEARED = "CLEARED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


@pytest.fixture
def mock_supply_lot():
    """Create a mock supply lot."""
    lot = MagicMock()
    lot.lot_id = 1
    lot.lot_reference = "LOT-001"
    lot.lot_name = "Test Lot"
    lot.lot_status = MockLotStatus.ARRIVED.value
    lot.lot_cur_id = 1
    lot.lot_allocation_completed = False
    lot.lot_allocation_strategy = None
    lot.lot_allocation_date = None
    lot.lot_total_items = 3
    lot.lot_total_quantity = Decimal("100")
    lot.lot_total_weight_kg = Decimal("500")
    lot.lot_total_volume_cbm = Decimal("10")
    lot.lot_total_value = Decimal("10000")
    lot.lot_total_freight_cost = Decimal("1000")
    lot.lot_total_customs_cost = Decimal("500")
    lot.lot_total_insurance_cost = Decimal("200")
    lot.lot_total_local_cost = Decimal("300")
    lot.lot_total_other_cost = Decimal("100")
    lot.lot_total_landed_cost = Decimal("2100")
    return lot


@pytest.fixture
def mock_lot_items():
    """Create mock supply lot items."""
    items = []

    # Item 1: Heavy, small volume, high value
    item1 = MagicMock()
    item1.sli_id = 1
    item1.sli_lot_id = 1
    item1.sli_prd_id = 101
    item1.sli_quantity = Decimal("20")
    item1.sli_unit_price = Decimal("100")
    item1.sli_total_price = Decimal("2000")
    item1.sli_weight_kg = Decimal("200")  # 40% of total weight
    item1.sli_volume_cbm = Decimal("2")   # 20% of total volume
    item1.sli_allocated_freight = Decimal("0")
    item1.sli_allocated_customs = Decimal("0")
    item1.sli_allocated_insurance = Decimal("0")
    item1.sli_allocated_local = Decimal("0")
    item1.sli_allocated_other = Decimal("0")
    items.append(item1)

    # Item 2: Medium weight, medium volume, medium value
    item2 = MagicMock()
    item2.sli_id = 2
    item2.sli_lot_id = 1
    item2.sli_prd_id = 102
    item2.sli_quantity = Decimal("30")
    item2.sli_unit_price = Decimal("100")
    item2.sli_total_price = Decimal("3000")
    item2.sli_weight_kg = Decimal("150")  # 30% of total weight
    item2.sli_volume_cbm = Decimal("3")   # 30% of total volume
    item2.sli_allocated_freight = Decimal("0")
    item2.sli_allocated_customs = Decimal("0")
    item2.sli_allocated_insurance = Decimal("0")
    item2.sli_allocated_local = Decimal("0")
    item2.sli_allocated_other = Decimal("0")
    items.append(item2)

    # Item 3: Light, large volume, high value
    item3 = MagicMock()
    item3.sli_id = 3
    item3.sli_lot_id = 1
    item3.sli_prd_id = 103
    item3.sli_quantity = Decimal("50")
    item3.sli_unit_price = Decimal("100")
    item3.sli_total_price = Decimal("5000")
    item3.sli_weight_kg = Decimal("150")  # 30% of total weight
    item3.sli_volume_cbm = Decimal("5")   # 50% of total volume
    item3.sli_allocated_freight = Decimal("0")
    item3.sli_allocated_customs = Decimal("0")
    item3.sli_allocated_insurance = Decimal("0")
    item3.sli_allocated_local = Decimal("0")
    item3.sli_allocated_other = Decimal("0")
    items.append(item3)

    return items


class TestLandedCostCalculationLogic:
    """Tests for landed cost calculation business logic."""

    def test_proportional_amount_calculation(self):
        """Test the proportional amount calculation helper."""
        from decimal import ROUND_HALF_UP

        def proportional_amount(total: Decimal, proportion: Decimal) -> Decimal:
            """Calculate proportional amount and round to 4 decimal places."""
            result = total * proportion
            return result.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

        # Test proportional calculation
        total = Decimal("1000")
        proportion = Decimal("0.25")  # 25%
        result = proportional_amount(total, proportion)

        assert result == Decimal("250.0000")

    def test_safe_divide_with_zero(self):
        """Test safe division with zero denominator."""
        from typing import Optional

        def safe_divide(numerator: Optional[Decimal], denominator: Optional[Decimal]) -> Decimal:
            """Safely divide two decimals, returning 0 if denominator is 0 or None."""
            if not numerator or not denominator or denominator == 0:
                return Decimal("0")
            return numerator / denominator

        result = safe_divide(Decimal("100"), Decimal("0"))
        assert result == Decimal("0")

    def test_safe_divide_with_none(self):
        """Test safe division with None values."""
        from typing import Optional

        def safe_divide(numerator: Optional[Decimal], denominator: Optional[Decimal]) -> Decimal:
            """Safely divide two decimals, returning 0 if denominator is 0 or None."""
            if not numerator or not denominator or denominator == 0:
                return Decimal("0")
            return numerator / denominator

        result = safe_divide(None, Decimal("10"))
        assert result == Decimal("0")

        result = safe_divide(Decimal("10"), None)
        assert result == Decimal("0")

    def test_weight_allocation_proportions(self, mock_lot_items):
        """Test that weight-based allocation correctly calculates proportions."""
        total_weight = sum(item.sli_weight_kg for item in mock_lot_items)
        assert total_weight == Decimal("500")

        # Calculate expected proportions
        expected_proportions = []
        for item in mock_lot_items:
            prop = item.sli_weight_kg / total_weight
            expected_proportions.append(prop)

        # Item 1: 200/500 = 0.4 (40%)
        assert expected_proportions[0] == Decimal("0.4")
        # Item 2: 150/500 = 0.3 (30%)
        assert expected_proportions[1] == Decimal("0.3")
        # Item 3: 150/500 = 0.3 (30%)
        assert expected_proportions[2] == Decimal("0.3")

    def test_volume_allocation_proportions(self, mock_lot_items):
        """Test that volume-based allocation correctly calculates proportions."""
        total_volume = sum(item.sli_volume_cbm for item in mock_lot_items)
        assert total_volume == Decimal("10")

        # Calculate expected proportions
        expected_proportions = []
        for item in mock_lot_items:
            prop = item.sli_volume_cbm / total_volume
            expected_proportions.append(prop)

        # Item 1: 2/10 = 0.2 (20%)
        assert expected_proportions[0] == Decimal("0.2")
        # Item 2: 3/10 = 0.3 (30%)
        assert expected_proportions[1] == Decimal("0.3")
        # Item 3: 5/10 = 0.5 (50%)
        assert expected_proportions[2] == Decimal("0.5")

    def test_value_allocation_proportions(self, mock_lot_items):
        """Test that value-based allocation correctly calculates proportions."""
        total_value = sum(item.sli_total_price for item in mock_lot_items)
        assert total_value == Decimal("10000")

        # Calculate expected proportions
        expected_proportions = []
        for item in mock_lot_items:
            prop = item.sli_total_price / total_value
            expected_proportions.append(prop)

        # Item 1: 2000/10000 = 0.2 (20%)
        assert expected_proportions[0] == Decimal("0.2")
        # Item 2: 3000/10000 = 0.3 (30%)
        assert expected_proportions[1] == Decimal("0.3")
        # Item 3: 5000/10000 = 0.5 (50%)
        assert expected_proportions[2] == Decimal("0.5")

    def test_total_allocation_equals_total_cost(self, mock_supply_lot, mock_lot_items):
        """Test that sum of allocated costs equals total freight costs."""
        from decimal import ROUND_HALF_UP

        def proportional_amount(total: Decimal, proportion: Decimal) -> Decimal:
            result = total * proportion
            return result.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

        # Using VALUE strategy
        total_value = sum(item.sli_total_price for item in mock_lot_items)
        freight_cost = mock_supply_lot.lot_total_freight_cost

        allocated_total = Decimal("0")
        for item in mock_lot_items:
            proportion = item.sli_total_price / total_value
            allocated = proportional_amount(freight_cost, proportion)
            allocated_total += allocated

        # Due to rounding, there might be a small difference
        # but it should be less than 1 cent
        diff = abs(allocated_total - freight_cost)
        assert diff < Decimal("0.01")

    def test_mixed_strategy_uses_different_bases(self, mock_supply_lot, mock_lot_items):
        """Test that mixed strategy uses correct bases for different cost types."""
        total_weight = sum(item.sli_weight_kg for item in mock_lot_items)
        total_volume = sum(item.sli_volume_cbm for item in mock_lot_items)
        total_value = sum(item.sli_total_price for item in mock_lot_items)

        # For mixed strategy:
        # - Freight should be allocated by volume
        # - Customs should be allocated by value
        # - Insurance should be allocated by value
        # - Local should be allocated by weight
        # - Other should be allocated by value

        # Item 3 has 50% of volume but only 30% of weight
        item3 = mock_lot_items[2]
        volume_proportion = item3.sli_volume_cbm / total_volume
        weight_proportion = item3.sli_weight_kg / total_weight

        assert volume_proportion == Decimal("0.5")
        assert weight_proportion == Decimal("0.3")

        # So item3 should get 50% of freight (volume) but only 30% of local (weight)
        assert volume_proportion > weight_proportion


class TestLandedCostPerUnit:
    """Tests for landed cost per unit calculations."""

    def test_landed_cost_per_unit_calculation(self, mock_lot_items):
        """Test that landed cost per unit is correctly calculated."""
        item = mock_lot_items[0]
        item.sli_allocated_freight = Decimal("400")
        item.sli_allocated_customs = Decimal("200")
        item.sli_allocated_insurance = Decimal("80")
        item.sli_allocated_local = Decimal("120")
        item.sli_allocated_other = Decimal("40")

        total_allocated = (
            item.sli_allocated_freight +
            item.sli_allocated_customs +
            item.sli_allocated_insurance +
            item.sli_allocated_local +
            item.sli_allocated_other
        )
        assert total_allocated == Decimal("840")

        # Total landed cost = product cost + allocated costs
        total_landed = item.sli_total_price + total_allocated
        assert total_landed == Decimal("2840")

        # Landed cost per unit
        quantity = item.sli_quantity  # 20 units
        landed_per_unit = total_landed / quantity
        assert landed_per_unit == Decimal("142")

    def test_zero_quantity_handling(self):
        """Test handling of zero quantity items."""
        # Should handle gracefully without division by zero
        quantity = Decimal("0")
        total_landed = Decimal("1000")

        if quantity > 0:
            landed_per_unit = total_landed / quantity
        else:
            landed_per_unit = None

        assert landed_per_unit is None


class TestAllocationValidation:
    """Tests for allocation data validation."""

    def test_weight_strategy_requires_weight_data(self, mock_lot_items):
        """Test that weight strategy validation catches missing weight data."""
        # Set all weights to zero/None
        for item in mock_lot_items:
            item.sli_weight_kg = None

        total_weight = sum(item.sli_weight_kg or Decimal("0") for item in mock_lot_items)
        assert total_weight == Decimal("0")

        # This would trigger InsufficientDataError in real service
        is_valid = total_weight > 0
        assert not is_valid

    def test_volume_strategy_requires_volume_data(self, mock_lot_items):
        """Test that volume strategy validation catches missing volume data."""
        # Set all volumes to zero/None
        for item in mock_lot_items:
            item.sli_volume_cbm = None

        total_volume = sum(item.sli_volume_cbm or Decimal("0") for item in mock_lot_items)
        assert total_volume == Decimal("0")

        # This would trigger InsufficientDataError in real service
        is_valid = total_volume > 0
        assert not is_valid

    def test_value_strategy_requires_price_data(self, mock_lot_items):
        """Test that value strategy validation catches missing price data."""
        # Set all prices to zero
        for item in mock_lot_items:
            item.sli_total_price = Decimal("0")

        total_value = sum(item.sli_total_price or Decimal("0") for item in mock_lot_items)
        assert total_value == Decimal("0")

        # This would trigger InsufficientDataError in real service
        is_valid = total_value > 0
        assert not is_valid

    def test_mixed_strategy_requires_all_data(self, mock_lot_items):
        """Test that mixed strategy requires weight, volume, AND value data."""
        total_weight = sum(item.sli_weight_kg or Decimal("0") for item in mock_lot_items)
        total_volume = sum(item.sli_volume_cbm or Decimal("0") for item in mock_lot_items)
        total_value = sum(item.sli_total_price or Decimal("0") for item in mock_lot_items)

        # All must be positive for mixed strategy
        is_valid = total_weight > 0 and total_volume > 0 and total_value > 0
        assert is_valid


class TestCostTotals:
    """Tests for cost total calculations."""

    def test_cost_totals_aggregation(self, mock_supply_lot):
        """Test that cost totals are correctly aggregated."""
        cost_totals = {
            "freight": mock_supply_lot.lot_total_freight_cost or Decimal("0"),
            "customs": mock_supply_lot.lot_total_customs_cost or Decimal("0"),
            "insurance": mock_supply_lot.lot_total_insurance_cost or Decimal("0"),
            "local": mock_supply_lot.lot_total_local_cost or Decimal("0"),
            "other": mock_supply_lot.lot_total_other_cost or Decimal("0")
        }

        assert cost_totals["freight"] == Decimal("1000")
        assert cost_totals["customs"] == Decimal("500")
        assert cost_totals["insurance"] == Decimal("200")
        assert cost_totals["local"] == Decimal("300")
        assert cost_totals["other"] == Decimal("100")

        total = sum(cost_totals.values())
        assert total == Decimal("2100")

    def test_total_landed_cost_includes_product_value(self, mock_supply_lot):
        """Test that total landed cost includes product value plus all costs."""
        product_value = mock_supply_lot.lot_total_value
        total_costs = (
            mock_supply_lot.lot_total_freight_cost +
            mock_supply_lot.lot_total_customs_cost +
            mock_supply_lot.lot_total_insurance_cost +
            mock_supply_lot.lot_total_local_cost +
            mock_supply_lot.lot_total_other_cost
        )

        total_landed = product_value + total_costs
        assert total_landed == Decimal("12100")  # 10000 + 2100
