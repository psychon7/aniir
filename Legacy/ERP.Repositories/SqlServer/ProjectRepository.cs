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
    public class ProjectRepository : BaseSqlServerRepository
    {
        private UserRepository UserRepository = new UserRepository();

        public int CreateUpdateProject(Project oneProject)
        {
            int prjId = 0;
            bool isCreate = false;
            if (oneProject.PrjId != 0)
            {
                var aPrj = _db.TM_PRJ_Project.FirstOrDefault(m => m.prj_id == oneProject.PrjId && m.soc_id == oneProject.SocId);
                if (aPrj != null)
                {
                    // update
                    oneProject.CliId = CreateClientForProject(oneProject);

                    aPrj = ProjectTranslator.EntityToRepository(oneProject, aPrj);
                    _db.TM_PRJ_Project.ApplyCurrentValues(aPrj);
                    _db.SaveChanges();
                    prjId = aPrj.prj_id;
                }
                else
                {
                    isCreate = true;
                }
            }
            else
            {
                isCreate = true;
            }
            if (isCreate)
            {
                // create 
                var newProject = new TM_PRJ_Project();
                oneProject.CliId = CreateClientForProject(oneProject);
                var lastItem = _db.TM_PRJ_Project.Where(m => m.soc_id == oneProject.SocId
                    && m.prj_d_creation.Year == oneProject.PrjDCreation.Year
                    && m.prj_d_creation.Month == oneProject.PrjDCreation.Month).OrderByDescending(m => m.prj_code).FirstOrDefault();
                string lastRef = string.Empty;
                if (lastItem != null)
                {
                    lastRef = lastItem.prj_code;
                }
                string pref = GetCodePref(4);
                oneProject.PrjCode = GetGeneralRefContinuation(oneProject.PrjDCreation, pref, lastRef, _codeType, oneProject.CliId);
                newProject = ProjectTranslator.EntityToRepository(oneProject, newProject, true);
                _db.TM_PRJ_Project.AddObject(newProject);
                try
                {
                    _db.SaveChanges();
                }
                catch (Exception)
                {
                }
                prjId = newProject.prj_id;
            }
            return prjId;
        }

        private int CreateClientForProject(Project oneProject)
        {
            if (oneProject.CliId == 0)
            {
                var checkClient = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_company_name == oneProject.ClientCompanyName);
                if (checkClient != null)
                {
                    oneProject.CliId = checkClient.cli_id;
                }
                else
                {
                    var oneclient = new Client
                    {
                        SocId = oneProject.SocId,
                        CompanyName = oneProject.ClientCompanyName,
                        VatId = oneProject.VatId,
                        PcoId = oneProject.PcoId,
                        PmoId = oneProject.PmoId,
                        UsrCreatedBy = oneProject.UsrCreatorId,
                        CtyId = 2,
                        CurId = 1,
                        Isactive = true,
                        Isblocked = false,
                        DateCreation = oneProject.PrjDCreation,
                        DateUpdate = oneProject.PrjDUpdate ?? oneProject.PrjDCreation,
                        RecieveNewsletter = false
                    };
                    ClientRepository ClientRepository = new ClientRepository();
                    int cliId = ClientRepository.CreateClientAutomatical(oneclient);
                    oneProject.CliId = cliId;
                }
            }
            return oneProject.CliId;
        }

        public Project LoadProjectById(int prjId, int socId)
        {
            var prj = _db.TM_PRJ_Project.Where(m => m.prj_id == prjId && m.soc_id == socId).Select(ProjectTranslator.RepositoryToEntity()).FirstOrDefault();
            if (prj != null)
            {
                prj.CliFId = StringCipher.EncoderSimple(prj.CliId.ToString(), "cliId");
                prj.FId = StringCipher.EncoderSimple(prj.PrjId.ToString(), "prjId");
            }
            return prj;
        }

        public Project LoadProjectById(int prjId, int socId, int usrId)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var prj = _db.TM_PRJ_Project.Where(m => m.prj_id == prjId && m.soc_id == socId
                && (isAdmin || m.usr_creator_id == usrId)).Select(ProjectTranslator.RepositoryToEntity()).FirstOrDefault();
            if (prj != null)
            {
                prj.CliFId = StringCipher.EncoderSimple(prj.CliId.ToString(), "cliId");
                prj.FId = StringCipher.EncoderSimple(prj.PrjId.ToString(), "prjId");
            }
            return prj;
        }

        public bool DeleteProject(int prjId, int socId)
        {
            bool isDeleted = false;
            var prj = _db.TM_PRJ_Project.FirstOrDefault(m => m.prj_id == prjId && m.soc_id == socId);
            if (prj != null)
            {
                if (!ProjectInUse(prjId, socId))
                {
                    try
                    {
                        _db.TM_PRJ_Project.DeleteObject(prj);
                        _db.SaveChanges();
                        isDeleted = true;
                    }
                    catch (Exception)
                    {
                    }
                }
            }
            return isDeleted;
        }

        public bool ProjectInUse(int prjId, int socId)
        {
            bool inUse = false;
            // check cost plan
            inUse = inUse || _db.TM_CPL_Cost_Plan.Any(m => m.prj_id == prjId && m.soc_id == socId);

            // todo : check commande

            // todo : check bon de livraison

            // todo : check facture

            // todo : 进货 货物管理
            return inUse;
        }

        public List<Project> SearchProject(int socId, string prjName, string prjCode, string clientName, int usrId)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var projects = _db.TM_PRJ_Project.Where(m => m.soc_id == socId
                                                         && (string.IsNullOrEmpty(prjName.Trim()) || m.prj_name.Contains(prjName.Trim()))
                                                         && (string.IsNullOrEmpty(prjCode.Trim()) || m.prj_code.Contains(prjCode.Trim()))
                                                         && (string.IsNullOrEmpty(clientName.Trim()) || m.TM_CLI_CLient.cli_company_name.Contains(clientName.Trim()))
                // is Admin
                && (isAdmin || m.usr_creator_id == usrId)
                ).Select(ProjectTranslator.RepositoryToEntity()).ToList();
            projects.ForEach(m => m.FId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId"));
            projects.ForEach(m => m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId"));
            return projects;
        }

        public int CheckCreateProject(Project oneProject)
        {
            int prjId = 0;
            bool isCreate = false;
            if (oneProject.PrjId != 0)
            {
                var aPrj = _db.TM_PRJ_Project.FirstOrDefault(m => m.prj_id == oneProject.PrjId && m.soc_id == oneProject.SocId);
                if (aPrj != null)
                {
                    prjId = aPrj.prj_id;
                }
                else
                {
                    isCreate = true;
                }
            }
            else
            {
                isCreate = true;
            }
            if (isCreate)
            {
                // create 
                var newProject = new TM_PRJ_Project();
                var lastItem = _db.TM_PRJ_Project.Where(m => m.soc_id == oneProject.SocId
                    && m.prj_d_creation.Year == oneProject.PrjDCreation.Year
                    && m.prj_d_creation.Month == oneProject.PrjDCreation.Month).OrderByDescending(m => m.prj_code).FirstOrDefault();
                string lastRef = string.Empty;
                if (lastItem != null)
                {
                    lastRef = lastItem.prj_code;
                }
                string pref = GetCodePref(4);
                oneProject.PrjCode = GetGeneralRefContinuation(oneProject.PrjDCreation, pref, lastRef, _codeType, oneProject.CliId);
                newProject = ProjectTranslator.EntityToRepository(oneProject, newProject, true);
                _db.TM_PRJ_Project.AddObject(newProject);
                try
                {
                    _db.SaveChanges();
                }
                catch (Exception)
                {
                }
                prjId = newProject.prj_id;
            }
            return prjId;
        }
    }
}
