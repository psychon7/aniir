using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class SupplierContactRepository : BaseSqlServerRepository
    {
        public SupplierContact CreateUpdateSupplierContact(SupplierContact contactClient)
        {
            int scoId = 0;
            bool create = false;
            if (contactClient.ScoId != 0)
            {
                var sco = _db.TM_SCO_Supplier_Contact.FirstOrDefault(m => m.sco_id == contactClient.ScoId);
                if (sco != null)
                {
                    sco = SupplierContactTranslator.EntityToRepository(contactClient, sco);
                    _db.TM_SCO_Supplier_Contact.ApplyCurrentValues(sco);
                    _db.SaveChanges();
                    scoId = sco.sco_id;
                }
                else
                {
                    create = true;
                }
            }
            else
            {
                create = true;
            }
            if (create)
            {
                var newsco = new TM_SCO_Supplier_Contact();
                var lastsco = _db.TM_SCO_Supplier_Contact.Where(m => m.TM_SUP_Supplier.soc_id == contactClient.SocId
                    && m.sco_d_creation.Year == contactClient.DateCreation.Year
                    && m.sco_d_creation.Month == contactClient.DateCreation.Month).OrderByDescending(m => m.sco_ref).FirstOrDefault();
                //var cli = _db.TM_SUP_Supplier.FirstOrDefault(m => m.sup_id == contactClient.SupId);
                string lastRef = string.Empty;
                if (lastsco != null)
                {
                    lastRef = lastsco.sco_ref;
                }
                string pref = GetCodePref(13);
                contactClient.ScoRef = GetGeneralRefContinuation(contactClient.DateCreation, pref, lastRef, _codeType, contactClient.SupId);
                newsco = SupplierContactTranslator.EntityToRepository(contactClient, newsco, true);
                _db.TM_SCO_Supplier_Contact.AddObject(newsco);

                _db.SaveChanges();

                scoId = newsco.sco_id;
            }
            contactClient.ScoId = scoId;
            return contactClient;
        }

        public SupplierContact LoadSupplierContactByScoId(int scoId)
        {
            var asco = _db.TM_SCO_Supplier_Contact.Where(m => m.sco_id == scoId).Select(SupplierContactTranslator.RepositoryToEntity()).FirstOrDefault();
            if (asco != null)
            {
                asco.FScoId = StringCipher.EncoderSimple(asco.ScoId.ToString(), "scoId");
                asco.FSupId = StringCipher.EncoderSimple(asco.SupId.ToString(), "supId");
            }
            return asco;
        }

        public List<SupplierContact> LoadSupplierContactsBySupId(int supId)
        {
            var scos = _db.TM_SCO_Supplier_Contact.Where(m => m.sup_id == supId).Select(SupplierContactTranslator.RepositoryToEntity()).ToList();
            foreach (var contactClient in scos)
            {
                contactClient.FScoId = StringCipher.EncoderSimple(contactClient.ScoId.ToString(), "scoId");
                contactClient.FSupId = StringCipher.EncoderSimple(contactClient.SupId.ToString(), "supId");
            }
            return scos.OrderBy(m => m.ScoAdresseTitle).ToList();
        }

        public bool DeleteSupplierContact(int scoId, int socId)
        {
            bool deleted = false;
            var sco = _db.TM_SCO_Supplier_Contact.FirstOrDefault(m => m.sco_id == scoId && m.TM_SUP_Supplier.soc_id == socId);
            if (sco != null)
            {
                try
                {
                    _db.TM_SCO_Supplier_Contact.DeleteObject(sco);
                    _db.SaveChanges();
                    deleted = true;
                }
                catch (Exception)
                {
                }
            }
            return deleted;
        }
    }
}
