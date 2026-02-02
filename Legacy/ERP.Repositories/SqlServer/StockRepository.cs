using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer
{
    /// <summary>
    /// Repository for TM_STK_Stock table operations
    /// Manages stock/inventory levels for products at warehouse locations
    /// </summary>
    public class StockRepository : BaseSqlServerRepository
    {
        #region Read Operations

        /// <summary>
        /// Get all stock records for a society
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <returns>List of stock records</returns>
        public List<Stock> GetAllStock(int socId)
        {
            var stocks = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId)
                .Select(m => new Stock
                {
                    StkId = m.stk_id,
                    SocId = m.soc_id,
                    PrdId = m.prd_id,
                    PitId = m.pit_id,
                    WhsId = m.whs_id,
                    StkQuantity = m.stk_quantity,
                    StkQuantityReserved = m.stk_quantity_reserved,
                    StkQuantityAvailable = m.stk_quantity_available,
                    StkMinQuantity = m.stk_min_quantity,
                    StkMaxQuantity = m.stk_max_quantity,
                    StkReorderQuantity = m.stk_reorder_quantity,
                    StkLocation = m.stk_location,
                    StkUnitCost = m.stk_unit_cost,
                    StkTotalValue = m.stk_total_value,
                    StkDLastCount = m.stk_d_last_count,
                    StkDLastMovement = m.stk_d_last_movement,
                    StkDCreation = m.stk_d_creation,
                    StkDUpdate = m.stk_d_update,
                    StkIsActive = m.stk_is_active,
                    StkNotes = m.stk_notes,
                    PrdName = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_name : string.Empty,
                    PrdRef = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_ref : string.Empty
                })
                .OrderBy(m => m.PrdName)
                .ToList();

            stocks.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.StkId.ToString(), "stkId"); });
            return stocks;
        }

        /// <summary>
        /// Get all active stock records for a society
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <returns>List of active stock records</returns>
        public List<Stock> GetActiveStock(int socId)
        {
            var stocks = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId && m.stk_is_active)
                .Select(m => new Stock
                {
                    StkId = m.stk_id,
                    SocId = m.soc_id,
                    PrdId = m.prd_id,
                    PitId = m.pit_id,
                    WhsId = m.whs_id,
                    StkQuantity = m.stk_quantity,
                    StkQuantityReserved = m.stk_quantity_reserved,
                    StkQuantityAvailable = m.stk_quantity_available,
                    StkMinQuantity = m.stk_min_quantity,
                    StkLocation = m.stk_location,
                    StkUnitCost = m.stk_unit_cost,
                    StkDLastMovement = m.stk_d_last_movement,
                    StkIsActive = m.stk_is_active,
                    PrdName = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_name : string.Empty,
                    PrdRef = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_ref : string.Empty
                })
                .OrderBy(m => m.PrdName)
                .ToList();

            stocks.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.StkId.ToString(), "stkId"); });
            return stocks;
        }

        /// <summary>
        /// Get a single stock record by ID
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="stkId">Stock ID</param>
        /// <returns>Stock entity or null</returns>
        public Stock GetStockById(int socId, int stkId)
        {
            var stock = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId && m.stk_id == stkId)
                .Select(m => new Stock
                {
                    StkId = m.stk_id,
                    SocId = m.soc_id,
                    PrdId = m.prd_id,
                    PitId = m.pit_id,
                    WhsId = m.whs_id,
                    StkQuantity = m.stk_quantity,
                    StkQuantityReserved = m.stk_quantity_reserved,
                    StkQuantityAvailable = m.stk_quantity_available,
                    StkMinQuantity = m.stk_min_quantity,
                    StkMaxQuantity = m.stk_max_quantity,
                    StkReorderQuantity = m.stk_reorder_quantity,
                    StkLocation = m.stk_location,
                    StkUnitCost = m.stk_unit_cost,
                    StkTotalValue = m.stk_total_value,
                    StkDLastCount = m.stk_d_last_count,
                    StkDLastMovement = m.stk_d_last_movement,
                    StkDCreation = m.stk_d_creation,
                    StkDUpdate = m.stk_d_update,
                    StkIsActive = m.stk_is_active,
                    StkNotes = m.stk_notes,
                    PrdName = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_name : string.Empty,
                    PrdRef = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_ref : string.Empty
                })
                .FirstOrDefault();

            if (stock != null)
            {
                stock.FId = StringCipher.EncoderSimple(stock.StkId.ToString(), "stkId");
            }
            return stock;
        }

        /// <summary>
        /// Get stock by product ID
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="prdId">Product ID</param>
        /// <returns>List of stock records for the product</returns>
        public List<Stock> GetStockByProduct(int socId, int prdId)
        {
            var stocks = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId && m.prd_id == prdId && m.stk_is_active)
                .Select(m => new Stock
                {
                    StkId = m.stk_id,
                    SocId = m.soc_id,
                    PrdId = m.prd_id,
                    PitId = m.pit_id,
                    WhsId = m.whs_id,
                    StkQuantity = m.stk_quantity,
                    StkQuantityReserved = m.stk_quantity_reserved,
                    StkQuantityAvailable = m.stk_quantity_available,
                    StkLocation = m.stk_location,
                    StkUnitCost = m.stk_unit_cost,
                    StkIsActive = m.stk_is_active,
                    PrdName = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_name : string.Empty,
                    PrdRef = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_ref : string.Empty
                })
                .OrderBy(m => m.StkLocation)
                .ToList();

            stocks.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.StkId.ToString(), "stkId"); });
            return stocks;
        }

        /// <summary>
        /// Get stock by product instance (SKU/variant)
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="pitId">Product Instance ID</param>
        /// <returns>List of stock records for the product instance</returns>
        public List<Stock> GetStockByProductInstance(int socId, int pitId)
        {
            var stocks = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId && m.pit_id == pitId && m.stk_is_active)
                .Select(m => new Stock
                {
                    StkId = m.stk_id,
                    SocId = m.soc_id,
                    PrdId = m.prd_id,
                    PitId = m.pit_id,
                    WhsId = m.whs_id,
                    StkQuantity = m.stk_quantity,
                    StkQuantityReserved = m.stk_quantity_reserved,
                    StkQuantityAvailable = m.stk_quantity_available,
                    StkLocation = m.stk_location,
                    StkIsActive = m.stk_is_active,
                    PrdName = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_name : string.Empty,
                    PrdRef = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_ref : string.Empty
                })
                .OrderBy(m => m.StkLocation)
                .ToList();

            stocks.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.StkId.ToString(), "stkId"); });
            return stocks;
        }

        /// <summary>
        /// Get stock by warehouse
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="whsId">Warehouse ID</param>
        /// <returns>List of stock records at the warehouse</returns>
        public List<Stock> GetStockByWarehouse(int socId, int whsId)
        {
            var stocks = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId && m.whs_id == whsId && m.stk_is_active)
                .Select(m => new Stock
                {
                    StkId = m.stk_id,
                    SocId = m.soc_id,
                    PrdId = m.prd_id,
                    PitId = m.pit_id,
                    WhsId = m.whs_id,
                    StkQuantity = m.stk_quantity,
                    StkQuantityReserved = m.stk_quantity_reserved,
                    StkQuantityAvailable = m.stk_quantity_available,
                    StkLocation = m.stk_location,
                    StkIsActive = m.stk_is_active,
                    PrdName = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_name : string.Empty,
                    PrdRef = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_ref : string.Empty
                })
                .OrderBy(m => m.StkLocation)
                .ThenBy(m => m.PrdName)
                .ToList();

            stocks.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.StkId.ToString(), "stkId"); });
            return stocks;
        }

        /// <summary>
        /// Get stock for a specific product at a specific warehouse
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="prdId">Product ID</param>
        /// <param name="whsId">Warehouse ID</param>
        /// <param name="pitId">Optional Product Instance ID</param>
        /// <returns>Stock record or null</returns>
        public Stock GetStockByProductAndWarehouse(int socId, int prdId, int whsId, int? pitId = null)
        {
            var query = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId && m.prd_id == prdId && m.whs_id == whsId);

            if (pitId.HasValue)
            {
                query = query.Where(m => m.pit_id == pitId.Value);
            }
            else
            {
                query = query.Where(m => m.pit_id == null);
            }

            var stock = query
                .Select(m => new Stock
                {
                    StkId = m.stk_id,
                    SocId = m.soc_id,
                    PrdId = m.prd_id,
                    PitId = m.pit_id,
                    WhsId = m.whs_id,
                    StkQuantity = m.stk_quantity,
                    StkQuantityReserved = m.stk_quantity_reserved,
                    StkQuantityAvailable = m.stk_quantity_available,
                    StkMinQuantity = m.stk_min_quantity,
                    StkMaxQuantity = m.stk_max_quantity,
                    StkReorderQuantity = m.stk_reorder_quantity,
                    StkLocation = m.stk_location,
                    StkUnitCost = m.stk_unit_cost,
                    StkTotalValue = m.stk_total_value,
                    StkDLastCount = m.stk_d_last_count,
                    StkDLastMovement = m.stk_d_last_movement,
                    StkDCreation = m.stk_d_creation,
                    StkDUpdate = m.stk_d_update,
                    StkIsActive = m.stk_is_active,
                    StkNotes = m.stk_notes,
                    PrdName = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_name : string.Empty,
                    PrdRef = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_ref : string.Empty
                })
                .FirstOrDefault();

            if (stock != null)
            {
                stock.FId = StringCipher.EncoderSimple(stock.StkId.ToString(), "stkId");
            }
            return stock;
        }

        /// <summary>
        /// Get low stock items (below minimum quantity)
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <returns>List of stock records below reorder point</returns>
        public List<Stock> GetLowStock(int socId)
        {
            var stocks = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId && m.stk_is_active &&
                       m.stk_min_quantity != null && m.stk_quantity_available <= m.stk_min_quantity)
                .Select(m => new Stock
                {
                    StkId = m.stk_id,
                    SocId = m.soc_id,
                    PrdId = m.prd_id,
                    PitId = m.pit_id,
                    WhsId = m.whs_id,
                    StkQuantity = m.stk_quantity,
                    StkQuantityReserved = m.stk_quantity_reserved,
                    StkQuantityAvailable = m.stk_quantity_available,
                    StkMinQuantity = m.stk_min_quantity,
                    StkReorderQuantity = m.stk_reorder_quantity,
                    StkLocation = m.stk_location,
                    StkIsActive = m.stk_is_active,
                    PrdName = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_name : string.Empty,
                    PrdRef = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_ref : string.Empty
                })
                .OrderBy(m => m.StkQuantityAvailable)
                .ToList();

            stocks.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.StkId.ToString(), "stkId"); });
            return stocks;
        }

        /// <summary>
        /// Search stock by product name or reference
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="searchTerm">Search term</param>
        /// <returns>List of matching stock records</returns>
        public List<Stock> SearchStock(int socId, string searchTerm)
        {
            var stocks = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId &&
                    (string.IsNullOrEmpty(searchTerm) ||
                     m.TM_PRD_Product.prd_name.Contains(searchTerm) ||
                     m.TM_PRD_Product.prd_ref.Contains(searchTerm) ||
                     m.stk_location.Contains(searchTerm)))
                .Select(m => new Stock
                {
                    StkId = m.stk_id,
                    SocId = m.soc_id,
                    PrdId = m.prd_id,
                    PitId = m.pit_id,
                    WhsId = m.whs_id,
                    StkQuantity = m.stk_quantity,
                    StkQuantityReserved = m.stk_quantity_reserved,
                    StkQuantityAvailable = m.stk_quantity_available,
                    StkLocation = m.stk_location,
                    StkIsActive = m.stk_is_active,
                    PrdName = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_name : string.Empty,
                    PrdRef = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_ref : string.Empty
                })
                .OrderBy(m => m.PrdName)
                .ToList();

            stocks.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.StkId.ToString(), "stkId"); });
            return stocks;
        }

        /// <summary>
        /// Get stock lookup for dropdowns
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <returns>List of KeyValue for dropdown</returns>
        public List<KeyValue> GetStockLookup(int socId)
        {
            var stocks = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId && m.stk_is_active)
                .Select(m => new KeyValue
                {
                    Key = m.stk_id,
                    Value = m.TM_PRD_Product != null ? m.TM_PRD_Product.prd_name : string.Empty,
                    Value2 = m.stk_location,
                    Actived = m.stk_is_active
                })
                .OrderBy(m => m.Value)
                .ToList();
            return stocks;
        }

        #endregion

        #region Write Operations

        /// <summary>
        /// Create or update a stock record
        /// </summary>
        /// <param name="stock">Stock entity</param>
        /// <returns>Stock ID</returns>
        public int CreateUpdateStock(Stock stock)
        {
            int stkId = 0;
            bool isCreate = false;
            DateTime now = DateTime.Now;

            if (stock.StkId != 0)
            {
                // Update existing stock
                var existingStock = _db.TM_STK_Stock.FirstOrDefault(m => m.soc_id == stock.SocId && m.stk_id == stock.StkId);
                if (existingStock != null)
                {
                    existingStock.prd_id = stock.PrdId;
                    existingStock.pit_id = stock.PitId;
                    existingStock.whs_id = stock.WhsId;
                    existingStock.stk_quantity = stock.StkQuantity;
                    existingStock.stk_quantity_reserved = stock.StkQuantityReserved;
                    existingStock.stk_quantity_available = stock.StkQuantity - stock.StkQuantityReserved;
                    existingStock.stk_min_quantity = stock.StkMinQuantity;
                    existingStock.stk_max_quantity = stock.StkMaxQuantity;
                    existingStock.stk_reorder_quantity = stock.StkReorderQuantity;
                    existingStock.stk_location = stock.StkLocation;
                    existingStock.stk_unit_cost = stock.StkUnitCost;
                    existingStock.stk_total_value = stock.StkUnitCost.HasValue ? stock.StkQuantity * stock.StkUnitCost.Value : (decimal?)null;
                    existingStock.stk_d_last_count = stock.StkDLastCount;
                    existingStock.stk_d_last_movement = stock.StkDLastMovement ?? now;
                    existingStock.stk_d_update = now;
                    existingStock.stk_is_active = stock.StkIsActive;
                    existingStock.stk_notes = stock.StkNotes;
                    _db.TM_STK_Stock.ApplyCurrentValues(existingStock);
                    _db.SaveChanges();
                    stkId = existingStock.stk_id;
                }
                else
                {
                    isCreate = true;
                }
            }
            else
            {
                // Check if stock record already exists for this product/warehouse/pit combination
                var checkStock = _db.TM_STK_Stock.FirstOrDefault(m =>
                    m.soc_id == stock.SocId &&
                    m.prd_id == stock.PrdId &&
                    m.whs_id == stock.WhsId &&
                    m.pit_id == stock.PitId);

                if (checkStock != null)
                {
                    // Update existing stock record
                    checkStock.stk_quantity = stock.StkQuantity;
                    checkStock.stk_quantity_reserved = stock.StkQuantityReserved;
                    checkStock.stk_quantity_available = stock.StkQuantity - stock.StkQuantityReserved;
                    checkStock.stk_min_quantity = stock.StkMinQuantity;
                    checkStock.stk_max_quantity = stock.StkMaxQuantity;
                    checkStock.stk_reorder_quantity = stock.StkReorderQuantity;
                    checkStock.stk_location = stock.StkLocation;
                    checkStock.stk_unit_cost = stock.StkUnitCost;
                    checkStock.stk_total_value = stock.StkUnitCost.HasValue ? stock.StkQuantity * stock.StkUnitCost.Value : (decimal?)null;
                    checkStock.stk_d_last_movement = stock.StkDLastMovement ?? now;
                    checkStock.stk_d_update = now;
                    checkStock.stk_is_active = stock.StkIsActive;
                    checkStock.stk_notes = stock.StkNotes;
                    _db.TM_STK_Stock.ApplyCurrentValues(checkStock);
                    _db.SaveChanges();
                    stkId = checkStock.stk_id;
                }
                else
                {
                    isCreate = true;
                }
            }

            if (isCreate)
            {
                var newStock = new TM_STK_Stock
                {
                    soc_id = stock.SocId,
                    prd_id = stock.PrdId,
                    pit_id = stock.PitId,
                    whs_id = stock.WhsId,
                    stk_quantity = stock.StkQuantity,
                    stk_quantity_reserved = stock.StkQuantityReserved,
                    stk_quantity_available = stock.StkQuantity - stock.StkQuantityReserved,
                    stk_min_quantity = stock.StkMinQuantity,
                    stk_max_quantity = stock.StkMaxQuantity,
                    stk_reorder_quantity = stock.StkReorderQuantity,
                    stk_location = stock.StkLocation,
                    stk_unit_cost = stock.StkUnitCost,
                    stk_total_value = stock.StkUnitCost.HasValue ? stock.StkQuantity * stock.StkUnitCost.Value : (decimal?)null,
                    stk_d_last_count = stock.StkDLastCount,
                    stk_d_last_movement = stock.StkDLastMovement ?? now,
                    stk_d_creation = now,
                    stk_d_update = now,
                    stk_is_active = stock.StkIsActive,
                    stk_notes = stock.StkNotes
                };
                _db.TM_STK_Stock.AddObject(newStock);
                _db.SaveChanges();
                stkId = newStock.stk_id;
            }

            return stkId;
        }

        /// <summary>
        /// Update stock quantity (add or subtract)
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="stkId">Stock ID</param>
        /// <param name="quantityChange">Quantity to add (positive) or subtract (negative)</param>
        /// <returns>True if updated successfully</returns>
        public bool UpdateStockQuantity(int socId, int stkId, decimal quantityChange)
        {
            var stock = _db.TM_STK_Stock.FirstOrDefault(m => m.soc_id == socId && m.stk_id == stkId);
            if (stock != null)
            {
                stock.stk_quantity += quantityChange;
                stock.stk_quantity_available = stock.stk_quantity - stock.stk_quantity_reserved;
                stock.stk_total_value = stock.stk_unit_cost.HasValue ? stock.stk_quantity * stock.stk_unit_cost.Value : stock.stk_total_value;
                stock.stk_d_last_movement = DateTime.Now;
                stock.stk_d_update = DateTime.Now;
                _db.TM_STK_Stock.ApplyCurrentValues(stock);
                _db.SaveChanges();
                return true;
            }
            return false;
        }

        /// <summary>
        /// Update reserved quantity
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="stkId">Stock ID</param>
        /// <param name="reservedQuantity">New reserved quantity</param>
        /// <returns>True if updated successfully</returns>
        public bool UpdateReservedQuantity(int socId, int stkId, decimal reservedQuantity)
        {
            var stock = _db.TM_STK_Stock.FirstOrDefault(m => m.soc_id == socId && m.stk_id == stkId);
            if (stock != null)
            {
                stock.stk_quantity_reserved = reservedQuantity;
                stock.stk_quantity_available = stock.stk_quantity - reservedQuantity;
                stock.stk_d_update = DateTime.Now;
                _db.TM_STK_Stock.ApplyCurrentValues(stock);
                _db.SaveChanges();
                return true;
            }
            return false;
        }

        /// <summary>
        /// Record stock count (physical inventory)
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="stkId">Stock ID</param>
        /// <param name="countedQuantity">Counted quantity</param>
        /// <returns>True if updated successfully</returns>
        public bool RecordStockCount(int socId, int stkId, decimal countedQuantity)
        {
            var stock = _db.TM_STK_Stock.FirstOrDefault(m => m.soc_id == socId && m.stk_id == stkId);
            if (stock != null)
            {
                stock.stk_quantity = countedQuantity;
                stock.stk_quantity_available = countedQuantity - stock.stk_quantity_reserved;
                stock.stk_total_value = stock.stk_unit_cost.HasValue ? countedQuantity * stock.stk_unit_cost.Value : stock.stk_total_value;
                stock.stk_d_last_count = DateTime.Now;
                stock.stk_d_last_movement = DateTime.Now;
                stock.stk_d_update = DateTime.Now;
                _db.TM_STK_Stock.ApplyCurrentValues(stock);
                _db.SaveChanges();
                return true;
            }
            return false;
        }

        /// <summary>
        /// Delete a stock record
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="stkId">Stock ID</param>
        /// <returns>True if deleted, false otherwise</returns>
        public bool DeleteStock(int socId, int stkId)
        {
            bool deleted = false;
            var stock = _db.TM_STK_Stock.FirstOrDefault(m => m.soc_id == socId && m.stk_id == stkId);
            if (stock != null)
            {
                _db.TM_STK_Stock.DeleteObject(stock);
                _db.SaveChanges();
                deleted = true;
            }
            return deleted;
        }

        /// <summary>
        /// Soft delete (deactivate) a stock record
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="stkId">Stock ID</param>
        /// <returns>True if deactivated</returns>
        public bool DeactivateStock(int socId, int stkId)
        {
            var stock = _db.TM_STK_Stock.FirstOrDefault(m => m.soc_id == socId && m.stk_id == stkId);
            if (stock != null)
            {
                stock.stk_is_active = false;
                stock.stk_d_update = DateTime.Now;
                _db.TM_STK_Stock.ApplyCurrentValues(stock);
                _db.SaveChanges();
                return true;
            }
            return false;
        }

        #endregion

        #region Utility Methods

        /// <summary>
        /// Check if stock is available for a product
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="prdId">Product ID</param>
        /// <param name="quantity">Required quantity</param>
        /// <param name="pitId">Optional Product Instance ID</param>
        /// <returns>True if available quantity is sufficient</returns>
        public bool IsStockAvailable(int socId, int prdId, decimal quantity, int? pitId = null)
        {
            var query = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId && m.prd_id == prdId && m.stk_is_active);

            if (pitId.HasValue)
            {
                query = query.Where(m => m.pit_id == pitId.Value);
            }

            var totalAvailable = query.Sum(m => (decimal?)m.stk_quantity_available) ?? 0;
            return totalAvailable >= quantity;
        }

        /// <summary>
        /// Get total available quantity for a product
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="prdId">Product ID</param>
        /// <param name="pitId">Optional Product Instance ID</param>
        /// <returns>Total available quantity</returns>
        public decimal GetTotalAvailableQuantity(int socId, int prdId, int? pitId = null)
        {
            var query = _db.TM_STK_Stock
                .Where(m => m.soc_id == socId && m.prd_id == prdId && m.stk_is_active);

            if (pitId.HasValue)
            {
                query = query.Where(m => m.pit_id == pitId.Value);
            }

            return query.Sum(m => (decimal?)m.stk_quantity_available) ?? 0;
        }

        #endregion
    }
}
