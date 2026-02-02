using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Repositories.SqlServer;
using ERP.Entities;
using ERP.Repositories;

namespace ERP.DataServices
{
    public class SiteProjectServices : SiteProjectRepository
    {
        public List<SiteProjectProduct> GetAllSiteProjectProducts(int prjId)
        {
            var prjs = base.GetAllSiteProjectProducts(prjId).OrderBy(m => m.PrdName).ToList();
            prjs.ForEach(m => m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId"));
            return prjs;
        }
    }
}
