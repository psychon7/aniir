using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Repositories.DataBase;
using ERP.Entities;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class SupplierProductRepository : BaseSqlServerRepository
    {
        public List<SupplierProduct> SerachSupplierProduct(int socId, string supName, string prdRef)
        {
            var sprs = _db.TR_SPR_Supplier_Product.Where(m => m.soc_id == socId
                && (string.IsNullOrEmpty(supName) || m.TM_SUP_Supplier.sup_company_name.Contains(supName))
                && (string.IsNullOrEmpty(prdRef) || m.spr_prd_ref.Contains(prdRef) || m.TM_PRD_Product.prd_ref.Contains(prdRef))
                ).Select(SupplierProductTranslator.RepositoryToEntity()).ToList();
            sprs.ForEach(m =>
            {
                m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                m.FId = StringCipher.EncoderSimple(m.Id.ToString(), "sprId");
                m.SupFId = StringCipher.EncoderSimple(m.SupId.ToString(), "supId");
            });
            return sprs;
        }

        public int CreateUpdateSupplierProduct(SupplierProduct spr)
        {
            bool create = false;
            int sprId = 0;
            var aspr = _db.TR_SPR_Supplier_Product.FirstOrDefault(m => m.soc_id == spr.SocId && (m.spr_id == spr.Id || (m.prd_id == spr.PrdId && m.sup_id == spr.SupId)));
            var soc = _db.TR_SOC_Society.FirstOrDefault(m => m.soc_id == spr.SocId);
            if (aspr != null)
            {
                aspr = SupplierProductTranslator.EntityToRepository(spr, aspr);
                _db.TR_SPR_Supplier_Product.ApplyCurrentValues(aspr);
                _db.SaveChanges();
            }
            else
            {
                create = true;
            }
            if (create && soc != null)
            {
                aspr = new TR_SPR_Supplier_Product();
                spr.CurId = soc.cur_id;
                aspr = SupplierProductTranslator.EntityToRepository(spr, aspr, true);
                _db.TR_SPR_Supplier_Product.AddObject(aspr);
                _db.SaveChanges();
                sprId = aspr.spr_id;
            }
            return sprId;
        }

        public void DeleteSupplierProduct(int socId, int supId, int sprId)
        {
            var spr = _db.TR_SPR_Supplier_Product.FirstOrDefault(m => m.soc_id == socId && m.spr_id == sprId && m.sup_id == supId);
            if (spr != null)
            {
                _db.TR_SPR_Supplier_Product.DeleteObject(spr);
                _db.SaveChanges();
            }
        }

        public List<SupplierProduct> GetProductsBySupId(int socId, int supId)
        {
            var spds = _db.TR_SPR_Supplier_Product.Where(m => m.sup_id == supId && m.soc_id == socId).Select(SupplierProductTranslator.RepositoryToEntity()).ToList();
            spds.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.Id.ToString(), "sprId");
                m.SupFId = StringCipher.EncoderSimple(m.SupId.ToString(), "supId");
                m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
            });
            return spds;
        }

        public SupplierProduct LoadSupplierProduct(int socId, int sprId)
        {
            var spr = _db.TR_SPR_Supplier_Product.Where(m => m.soc_id == socId && m.spr_id == sprId).Select(SupplierProductTranslator.RepositoryToEntity()).ToList();
            spr.ForEach(m =>
            {
                m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                m.FId = StringCipher.EncoderSimple(m.Id.ToString(), "sprId");
                m.SupFId = StringCipher.EncoderSimple(m.SupId.ToString(), "supId");
            });
            return spr.FirstOrDefault();
        }

        public SupplierProduct GetSupplierProduct(int socId, int supId, int prdId)
        {
            var spr = _db.TR_SPR_Supplier_Product.Where(m => m.soc_id == socId && m.sup_id == supId && m.prd_id == prdId).Select(SupplierProductTranslator.RepositoryToEntity()).FirstOrDefault();
            return spr;
        }

        public List<SupplierProduct> GetSupplierByProductId(int socId, int prdId)
        {
            var spr = _db.TR_SPR_Supplier_Product.Where(m => m.soc_id == socId && m.prd_id == prdId).Select(SupplierProductTranslator.RepositoryToEntity()).OrderBy(m => m.SupplierName).ToList();
            spr.ForEach(m => m.FId = StringCipher.EncoderSimple(m.SupId.ToString(), "supId"));
            return spr;
        }
    }
}
