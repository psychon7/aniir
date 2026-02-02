using System;

namespace ERP.Entities
{
    /// <summary>
    /// Unit of Measure entity model for TR_UOM_UnitOfMeasure table
    /// Used for product quantities, inventory, and order line items
    /// </summary>
    [Serializable]
    public class UnitOfMeasure : BaseClass
    {
        /// <summary>
        /// Unit of Measure ID (uom_id)
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Unit code (uom_code) - e.g., "KG", "PC", "M", "L"
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Unit designation/name (uom_designation) - e.g., "Kilogram", "Piece", "Meter"
        /// </summary>
        public string Designation { get; set; }

        /// <summary>
        /// Unit description (uom_description) - detailed description of the unit
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Whether the unit is active (uom_isactive)
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// Display name combining designation and code
        /// </summary>
        public string DisplayName
        {
            get { return $"{Designation} ({Code})"; }
        }
    }
}
