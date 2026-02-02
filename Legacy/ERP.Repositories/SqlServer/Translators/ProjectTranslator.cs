using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public static class ProjectTranslator
    {
        public static Expression<Func<TM_PRJ_Project, Project>> RepositoryToEntity()
        {
            return o => new Project
            {
                CliId = o.cli_id,
                ClientCompanyName = o.TM_CLI_CLient.cli_company_name,
                PcoId = o.pco_id,
                PmoId = o.pmo_id,
                PrjCode = o.prj_code,
                PrjName = o.prj_name,
                PrjClientComment = o.prj_client_comment,
                PrjDCreation = o.prj_d_creation,
                SocId = o.soc_id,
                PrjDUpdate = o.prj_d_update,
                PrjFooterText = o.prj_footer_text,
                PrjHeaderText = o.prj_header_text,
                PrjId = o.prj_id,
                PrjInterComment = o.prj_inter_comment,
                UsrCreatorId = o.usr_creator_id,
                VatId = o.vat_id
            };
        }

        public static TM_PRJ_Project EntityToRepository(Project _from, TM_PRJ_Project _to, bool create = false)
        {
            _to.vat_id = _from.VatId;
            _to.pco_id = _from.PcoId;
            _to.pmo_id = _from.PmoId;
            _to.prj_d_update = _from.PrjDUpdate < new DateTime(1971) ? DateTime.Now : _from.PrjDUpdate;
            _to.cli_id = _from.CliId;
            _to.prj_header_text = _from.PrjHeaderText;
            _to.prj_footer_text = _from.PrjFooterText;
            _to.prj_client_comment = _from.PrjClientComment;
            _to.prj_inter_comment = _from.PrjInterComment;
            _to.prj_name = _from.PrjName;
            if (create)
            {
                _to.usr_creator_id = _from.UsrCreatorId;
                _to.soc_id = _from.SocId;
                _to.prj_d_creation = _from.PrjDCreation < new DateTime(1971) ? DateTime.Now : _from.PrjDCreation;
                _to.prj_code = _from.PrjCode;
            }
            return _to;
        }
    }
}
