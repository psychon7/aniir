using System;

namespace ERP.Entities
{
    /// <summary>
    /// Stock entity model for TM_STK_Stock table
    /// Tracks inventory stock levels for products at warehouse locations
    /// </summary>
    [Serializable]
    public class Stock : BaseClass
    {
        /// <summary>
        /// Stock ID (stk_id) - Primary key
        /// </summary>
        public int StkId { get; set; }

        /// <summary>
        /// Society/Company ID (soc_id) for multi-tenant support
        /// </summary>
        public int SocId { get; set; }

        /// <summary>
        /// Product ID (prd_id) - Reference to TM_PRD_Product
        /// </summary>
        public int PrdId { get; set; }

        /// <summary>
        /// Product Instance ID (pit_id) - Reference to TM_PIT_Product_Instance (SKU/variant)
        /// Nullable for products without variants
        /// </summary>
        public int? PitId { get; set; }

        /// <summary>
        /// Warehouse ID (whs_id) - Reference to warehouse/storage location
        /// </summary>
        public int? WhsId { get; set; }

        /// <summary>
        /// Current quantity in stock (stk_quantity)
        /// </summary>
        public decimal StkQuantity { get; set; }

        /// <summary>
        /// Reserved quantity (stk_quantity_reserved) - quantity allocated to orders
        /// </summary>
        public decimal StkQuantityReserved { get; set; }

        /// <summary>
        /// Available quantity (stk_quantity_available) - computed: StkQuantity - StkQuantityReserved
        /// </summary>
        public decimal StkQuantityAvailable { get; set; }

        /// <summary>
        /// Minimum stock level (stk_min_quantity) - reorder point
        /// </summary>
        public decimal? StkMinQuantity { get; set; }

        /// <summary>
        /// Maximum stock level (stk_max_quantity)
        /// </summary>
        public decimal? StkMaxQuantity { get; set; }

        /// <summary>
        /// Reorder quantity (stk_reorder_quantity) - quantity to order when at min level
        /// </summary>
        public decimal? StkReorderQuantity { get; set; }

        /// <summary>
        /// Stock location/bin code (stk_location) - specific shelf/bin location
        /// </summary>
        public string StkLocation { get; set; }

        /// <summary>
        /// Unit cost (stk_unit_cost) - average cost per unit
        /// </summary>
        public decimal? StkUnitCost { get; set; }

        /// <summary>
        /// Total stock value (stk_total_value) - computed: StkQuantity * StkUnitCost
        /// </summary>
        public decimal? StkTotalValue { get; set; }

        /// <summary>
        /// Last stock count date (stk_d_last_count)
        /// </summary>
        public DateTime? StkDLastCount { get; set; }

        /// <summary>
        /// Last stock movement date (stk_d_last_movement)
        /// </summary>
        public DateTime? StkDLastMovement { get; set; }

        /// <summary>
        /// Creation date (stk_d_creation)
        /// </summary>
        public DateTime StkDCreation { get; set; }

        /// <summary>
        /// Last update date (stk_d_update)
        /// </summary>
        public DateTime StkDUpdate { get; set; }

        /// <summary>
        /// Whether the stock record is active (stk_is_active)
        /// </summary>
        public bool StkIsActive { get; set; }

        /// <summary>
        /// Notes/comments (stk_notes)
        /// </summary>
        public string StkNotes { get; set; }

        // Navigation properties for display purposes

        /// <summary>
        /// Product name (for display)
        /// </summary>
        public string PrdName { get; set; }

        /// <summary>
        /// Product reference code (for display)
        /// </summary>
        public string PrdRef { get; set; }

        /// <summary>
        /// Product instance/variant name (for display)
        /// </summary>
        public string PitName { get; set; }

        /// <summary>
        /// Warehouse name (for display)
        /// </summary>
        public string WhsName { get; set; }
    }
}
