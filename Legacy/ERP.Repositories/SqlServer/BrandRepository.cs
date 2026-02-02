using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer
{
    public class BrandRepository : BaseSqlServerRepository
    {
        /// <summary>
        /// Get all brands for a society
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <returns>List of brands</returns>
        public List<Brand> GetAllBrands(int socId)
        {
            var brands = _db.TR_BRA_Brand
                .Where(m => m.soc_id == socId)
                .Select(m => new Brand
                {
                    BraId = m.bra_id,
                    SocId = m.soc_id,
                    BraCode = m.bra_code,
                    BraName = m.bra_name,
                    BraDescription = m.bra_description,
                    BraIsActived = m.bra_is_actived
                })
                .OrderBy(m => m.BraName)
                .ToList();

            brands.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.BraId.ToString(), "braId"); });
            return brands;
        }

        /// <summary>
        /// Get all active brands for a society (for dropdowns)
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <returns>List of active brands as KeyValue</returns>
        public List<KeyValue> GetActiveBrandsLookup(int socId)
        {
            var brands = _db.TR_BRA_Brand
                .Where(m => m.soc_id == socId && m.bra_is_actived)
                .Select(m => new KeyValue
                {
                    Key = m.bra_id,
                    Value = m.bra_name,
                    Value2 = m.bra_code,
                    Actived = m.bra_is_actived
                })
                .OrderBy(m => m.Value)
                .ToList();
            return brands;
        }

        /// <summary>
        /// Get a single brand by ID
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="braId">Brand ID</param>
        /// <returns>Brand entity or null</returns>
        public Brand GetBrandById(int socId, int braId)
        {
            var brand = _db.TR_BRA_Brand
                .Where(m => m.soc_id == socId && m.bra_id == braId)
                .Select(m => new Brand
                {
                    BraId = m.bra_id,
                    SocId = m.soc_id,
                    BraCode = m.bra_code,
                    BraName = m.bra_name,
                    BraDescription = m.bra_description,
                    BraIsActived = m.bra_is_actived
                })
                .FirstOrDefault();

            if (brand != null)
            {
                brand.FId = StringCipher.EncoderSimple(brand.BraId.ToString(), "braId");
            }
            return brand;
        }

        /// <summary>
        /// Create or update a brand
        /// </summary>
        /// <param name="brand">Brand entity</param>
        /// <returns>Brand ID</returns>
        public int CreateUpdateBrand(Brand brand)
        {
            int braId = 0;
            bool isCreate = false;

            if (brand.BraId != 0)
            {
                // Update existing brand
                var existingBrand = _db.TR_BRA_Brand.FirstOrDefault(m => m.soc_id == brand.SocId && m.bra_id == brand.BraId);
                if (existingBrand != null)
                {
                    existingBrand.bra_code = brand.BraCode;
                    existingBrand.bra_name = brand.BraName;
                    existingBrand.bra_description = brand.BraDescription;
                    existingBrand.bra_is_actived = brand.BraIsActived;
                    _db.TR_BRA_Brand.ApplyCurrentValues(existingBrand);
                    _db.SaveChanges();
                    braId = existingBrand.bra_id;
                }
                else
                {
                    isCreate = true;
                }
            }
            else
            {
                // Check if brand with same code exists
                var checkBrand = _db.TR_BRA_Brand.FirstOrDefault(m => m.bra_code == brand.BraCode && m.soc_id == brand.SocId);
                if (checkBrand != null)
                {
                    // Update existing brand with same code
                    checkBrand.bra_name = brand.BraName;
                    checkBrand.bra_description = brand.BraDescription;
                    checkBrand.bra_is_actived = brand.BraIsActived;
                    _db.TR_BRA_Brand.ApplyCurrentValues(checkBrand);
                    _db.SaveChanges();
                    braId = checkBrand.bra_id;
                }
                else
                {
                    isCreate = true;
                }
            }

            if (isCreate)
            {
                var newBrand = new TR_BRA_Brand
                {
                    soc_id = brand.SocId,
                    bra_code = brand.BraCode,
                    bra_name = brand.BraName,
                    bra_description = brand.BraDescription,
                    bra_is_actived = brand.BraIsActived
                };
                _db.TR_BRA_Brand.AddObject(newBrand);
                _db.SaveChanges();
                braId = newBrand.bra_id;
            }

            return braId;
        }

        /// <summary>
        /// Delete a brand
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="braId">Brand ID</param>
        /// <returns>True if deleted, false otherwise</returns>
        public bool DeleteBrand(int socId, int braId)
        {
            bool deleted = false;
            var brand = _db.TR_BRA_Brand.FirstOrDefault(m => m.soc_id == socId && m.bra_id == braId);
            if (brand != null)
            {
                // Check if brand is in use by products
                var inUse = _db.TM_PRD_Product.Any(m => m.bra_id == braId && m.soc_id == socId);
                if (!inUse)
                {
                    _db.TR_BRA_Brand.DeleteObject(brand);
                    _db.SaveChanges();
                    deleted = true;
                }
            }
            return deleted;
        }

        /// <summary>
        /// Search brands by name or code
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="searchTerm">Search term</param>
        /// <returns>List of matching brands</returns>
        public List<Brand> SearchBrands(int socId, string searchTerm)
        {
            var brands = _db.TR_BRA_Brand
                .Where(m => m.soc_id == socId &&
                    (string.IsNullOrEmpty(searchTerm) ||
                     m.bra_name.Contains(searchTerm) ||
                     m.bra_code.Contains(searchTerm)))
                .Select(m => new Brand
                {
                    BraId = m.bra_id,
                    SocId = m.soc_id,
                    BraCode = m.bra_code,
                    BraName = m.bra_name,
                    BraDescription = m.bra_description,
                    BraIsActived = m.bra_is_actived
                })
                .OrderBy(m => m.BraName)
                .ToList();

            brands.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.BraId.ToString(), "braId"); });
            return brands;
        }
    }
}
