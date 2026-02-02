using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Entities;
using ERP.Repositories.SqlServer;

namespace ERP.DataServices
{
    /// <summary>
    /// Service layer for Stock operations
    /// Inherits from StockRepository and can add business logic as needed
    /// </summary>
    public class StockServices : StockRepository
    {
        /// <summary>
        /// Get stock summary for a product across all warehouses
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="prdId">Product ID</param>
        /// <returns>Stock summary with totals</returns>
        public StockSummary GetProductStockSummary(int socId, int prdId)
        {
            var stocks = GetStockByProduct(socId, prdId);
            return new StockSummary
            {
                PrdId = prdId,
                TotalQuantity = stocks.Sum(s => s.StkQuantity),
                TotalReserved = stocks.Sum(s => s.StkQuantityReserved),
                TotalAvailable = stocks.Sum(s => s.StkQuantityAvailable),
                TotalValue = stocks.Sum(s => s.StkTotalValue ?? 0),
                WarehouseCount = stocks.Select(s => s.WhsId).Distinct().Count(),
                StockRecords = stocks
            };
        }

        /// <summary>
        /// Allocate stock for an order (reserve quantity)
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="prdId">Product ID</param>
        /// <param name="quantity">Quantity to reserve</param>
        /// <param name="pitId">Optional Product Instance ID</param>
        /// <returns>True if allocation successful</returns>
        public bool AllocateStock(int socId, int prdId, decimal quantity, int? pitId = null)
        {
            // Check if enough stock is available
            if (!IsStockAvailable(socId, prdId, quantity, pitId))
            {
                return false;
            }

            // Get stock records ordered by available quantity (allocate from highest first)
            var stocks = GetStockByProduct(socId, prdId)
                .Where(s => !pitId.HasValue || s.PitId == pitId)
                .OrderByDescending(s => s.StkQuantityAvailable)
                .ToList();

            decimal remainingToAllocate = quantity;

            foreach (var stock in stocks)
            {
                if (remainingToAllocate <= 0) break;

                decimal canAllocate = Math.Min(stock.StkQuantityAvailable, remainingToAllocate);
                if (canAllocate > 0)
                {
                    UpdateReservedQuantity(socId, stock.StkId, stock.StkQuantityReserved + canAllocate);
                    remainingToAllocate -= canAllocate;
                }
            }

            return remainingToAllocate <= 0;
        }

        /// <summary>
        /// Release allocated stock (unreserve quantity)
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="prdId">Product ID</param>
        /// <param name="quantity">Quantity to release</param>
        /// <param name="pitId">Optional Product Instance ID</param>
        /// <returns>True if release successful</returns>
        public bool ReleaseAllocatedStock(int socId, int prdId, decimal quantity, int? pitId = null)
        {
            var stocks = GetStockByProduct(socId, prdId)
                .Where(s => (!pitId.HasValue || s.PitId == pitId) && s.StkQuantityReserved > 0)
                .OrderByDescending(s => s.StkQuantityReserved)
                .ToList();

            decimal remainingToRelease = quantity;

            foreach (var stock in stocks)
            {
                if (remainingToRelease <= 0) break;

                decimal canRelease = Math.Min(stock.StkQuantityReserved, remainingToRelease);
                if (canRelease > 0)
                {
                    UpdateReservedQuantity(socId, stock.StkId, stock.StkQuantityReserved - canRelease);
                    remainingToRelease -= canRelease;
                }
            }

            return remainingToRelease <= 0;
        }

        /// <summary>
        /// Transfer stock between warehouses
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="fromStkId">Source stock record ID</param>
        /// <param name="toWhsId">Destination warehouse ID</param>
        /// <param name="quantity">Quantity to transfer</param>
        /// <returns>Destination stock ID if successful, 0 otherwise</returns>
        public int TransferStock(int socId, int fromStkId, int toWhsId, decimal quantity)
        {
            var fromStock = GetStockById(socId, fromStkId);
            if (fromStock == null || fromStock.StkQuantityAvailable < quantity)
            {
                return 0;
            }

            // Reduce source stock
            UpdateStockQuantity(socId, fromStkId, -quantity);

            // Find or create destination stock record
            var toStock = GetStockByProductAndWarehouse(socId, fromStock.PrdId, toWhsId, fromStock.PitId);

            if (toStock != null)
            {
                // Update existing destination stock
                UpdateStockQuantity(socId, toStock.StkId, quantity);
                return toStock.StkId;
            }
            else
            {
                // Create new stock record at destination
                var newStock = new Stock
                {
                    SocId = socId,
                    PrdId = fromStock.PrdId,
                    PitId = fromStock.PitId,
                    WhsId = toWhsId,
                    StkQuantity = quantity,
                    StkQuantityReserved = 0,
                    StkQuantityAvailable = quantity,
                    StkUnitCost = fromStock.StkUnitCost,
                    StkIsActive = true,
                    StkNotes = $"Transferred from stock #{fromStkId}"
                };
                return CreateUpdateStock(newStock);
            }
        }
    }

    /// <summary>
    /// Stock summary class for aggregated stock information
    /// </summary>
    public class StockSummary
    {
        public int PrdId { get; set; }
        public decimal TotalQuantity { get; set; }
        public decimal TotalReserved { get; set; }
        public decimal TotalAvailable { get; set; }
        public decimal TotalValue { get; set; }
        public int WarehouseCount { get; set; }
        public List<Stock> StockRecords { get; set; }
    }
}
