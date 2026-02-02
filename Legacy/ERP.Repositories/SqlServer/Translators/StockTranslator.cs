using System;
using System.Linq.Expressions;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    /// <summary>
    /// Translator for TM_STK_Stock table
    /// Handles mapping between Stock entity and database model
    /// </summary>
    public class StockTranslator
    {
        /// <summary>
        /// Convert database model to Stock entity (LINQ expression for queries)
        /// </summary>
        /// <returns>Expression for LINQ projection</returns>
        public static Expression<Func<TM_STK_Stock, Stock>> RepositoryToEntity()
        {
            return o => new Stock
            {
                StkId = o.stk_id,
                SocId = o.soc_id,
                PrdId = o.prd_id,
                PitId = o.pit_id,
                WhsId = o.whs_id,
                StkQuantity = o.stk_quantity,
                StkQuantityReserved = o.stk_quantity_reserved,
                StkQuantityAvailable = o.stk_quantity_available,
                StkMinQuantity = o.stk_min_quantity,
                StkMaxQuantity = o.stk_max_quantity,
                StkReorderQuantity = o.stk_reorder_quantity,
                StkLocation = o.stk_location,
                StkUnitCost = o.stk_unit_cost,
                StkTotalValue = o.stk_total_value,
                StkDLastCount = o.stk_d_last_count,
                StkDLastMovement = o.stk_d_last_movement,
                StkDCreation = o.stk_d_creation,
                StkDUpdate = o.stk_d_update,
                StkIsActive = o.stk_is_active,
                StkNotes = o.stk_notes,
                PrdName = o.TM_PRD_Product != null ? o.TM_PRD_Product.prd_name : string.Empty,
                PrdRef = o.TM_PRD_Product != null ? o.TM_PRD_Product.prd_ref : string.Empty
            };
        }

        /// <summary>
        /// Convert database model to Stock entity with additional navigation properties
        /// </summary>
        /// <returns>Expression for LINQ projection with full details</returns>
        public static Expression<Func<TM_STK_Stock, Stock>> RepositoryToEntityWithDetails()
        {
            return o => new Stock
            {
                StkId = o.stk_id,
                SocId = o.soc_id,
                PrdId = o.prd_id,
                PitId = o.pit_id,
                WhsId = o.whs_id,
                StkQuantity = o.stk_quantity,
                StkQuantityReserved = o.stk_quantity_reserved,
                StkQuantityAvailable = o.stk_quantity_available,
                StkMinQuantity = o.stk_min_quantity,
                StkMaxQuantity = o.stk_max_quantity,
                StkReorderQuantity = o.stk_reorder_quantity,
                StkLocation = o.stk_location,
                StkUnitCost = o.stk_unit_cost,
                StkTotalValue = o.stk_total_value,
                StkDLastCount = o.stk_d_last_count,
                StkDLastMovement = o.stk_d_last_movement,
                StkDCreation = o.stk_d_creation,
                StkDUpdate = o.stk_d_update,
                StkIsActive = o.stk_is_active,
                StkNotes = o.stk_notes,
                PrdName = o.TM_PRD_Product != null ? o.TM_PRD_Product.prd_name : string.Empty,
                PrdRef = o.TM_PRD_Product != null ? o.TM_PRD_Product.prd_ref : string.Empty,
                PitName = o.TM_PIT_Product_Instance != null ? o.TM_PIT_Product_Instance.pit_name : string.Empty,
                WhsName = o.TM_WHS_Warehouse != null ? o.TM_WHS_Warehouse.whs_name : string.Empty
            };
        }

        /// <summary>
        /// Convert Stock entity back to database model
        /// </summary>
        /// <param name="_from">Source Stock entity</param>
        /// <param name="_to">Target database model (null for create)</param>
        /// <param name="create">True if creating new record</param>
        /// <returns>Database model</returns>
        public static TM_STK_Stock EntityToRepository(Stock _from, TM_STK_Stock _to, bool create = false)
        {
            if (_to == null || create)
            {
                _to = new TM_STK_Stock
                {
                    soc_id = _from.SocId,
                    stk_d_creation = DateTime.Now
                };
            }

            _to.prd_id = _from.PrdId;
            _to.pit_id = _from.PitId;
            _to.whs_id = _from.WhsId;
            _to.stk_quantity = _from.StkQuantity;
            _to.stk_quantity_reserved = _from.StkQuantityReserved;
            _to.stk_quantity_available = _from.StkQuantity - _from.StkQuantityReserved;
            _to.stk_min_quantity = _from.StkMinQuantity;
            _to.stk_max_quantity = _from.StkMaxQuantity;
            _to.stk_reorder_quantity = _from.StkReorderQuantity;
            _to.stk_location = _from.StkLocation;
            _to.stk_unit_cost = _from.StkUnitCost;
            _to.stk_total_value = _from.StkUnitCost.HasValue ? _from.StkQuantity * _from.StkUnitCost.Value : (decimal?)null;
            _to.stk_d_last_count = _from.StkDLastCount;
            _to.stk_d_last_movement = _from.StkDLastMovement ?? DateTime.Now;
            _to.stk_d_update = DateTime.Now;
            _to.stk_is_active = _from.StkIsActive;
            _to.stk_notes = _from.StkNotes;

            return _to;
        }
    }
}
