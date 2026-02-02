using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Hosting;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class UserHRepository : BaseSqlServerRepository
    {
        public UserCommentFlagH GetUserComment(int usrId, string fkName, int fkId)
        {
            var oneComment = _db.TH_UCT_User_Comment.FirstOrDefault(m => m.usr_id == usrId && m.uct_fk_name == fkName && m.uct_fk_id == fkId);
            if (oneComment != null)
            {
                var comment = new UserCommentFlagH
                {
                    Id = oneComment.uct_id,
                    DCreation = oneComment.uct_d_creation,
                    Comment = oneComment.uct_comment,
                    FkName = oneComment.uct_fk_name,
                    UsrId = oneComment.usr_id,
                    DUpdate = oneComment.uct_d_update
                };
                return comment;
            }
            else
            {
                return null;
            }
        }

        public UserCommentFlagH GetUserFlag(int usrId, string fkName, int fkId)
        {
            var oneFlag = _db.TH_UFL_User_Flag.FirstOrDefault(m => m.usr_id == usrId && m.ufl_fk_name == fkName && m.ufl_fk_id == fkId);
            if (oneFlag != null)
            {
                var flag = new UserCommentFlagH
                {
                    Id = oneFlag.ufl_id,
                    DCreation = oneFlag.ufl_d_creation,
                    Comment = oneFlag.ufl_comment,
                    FkName = oneFlag.ufl_fk_name,
                    UsrId = oneFlag.usr_id,
                    DUpdate = oneFlag.ufl_d_update
                };
                return flag;
            }
            else
            {
                return null;
            }
        }

        public UserCommentFlagH CreateUpdateUserComment(int usrId, string fkName, int fkId, string comment, bool delete)
        {
            var onecomment = _db.TH_UCT_User_Comment.FirstOrDefault(m => m.usr_id == usrId && m.uct_fk_name == fkName && m.uct_fk_id == fkId);
            if (onecomment != null)
            {
                if (delete)
                {
                    _db.TH_UCT_User_Comment.DeleteObject(onecomment);
                    _db.SaveChanges();
                }
                else
                {
                    onecomment.uct_d_update = DateTime.Now;
                    onecomment.uct_comment = comment;
                    _db.TH_UCT_User_Comment.ApplyCurrentValues(onecomment);
                    _db.SaveChanges();
                }
            }
            else
            {
                if (!delete)
                {
                    onecomment = new TH_UCT_User_Comment
                    {
                        usr_id = usrId,
                        uct_comment = comment,
                        uct_d_creation = DateTime.Now,
                        uct_d_update = DateTime.Now,
                        uct_fk_id = fkId,
                        uct_fk_name = fkName
                    };
                    _db.TH_UCT_User_Comment.AddObject(onecomment);
                    _db.SaveChanges();
                }
            }
            return GetUserComment(usrId, fkName, fkId);
        }

        public UserCommentFlagH CreateUpdateUserFlag(int usrId, string fkName, int fkId, string btnClass, bool delete)
        {
            var oneFlag = _db.TH_UFL_User_Flag.FirstOrDefault(m => m.usr_id == usrId && m.ufl_fk_name == fkName && m.ufl_fk_id == fkId);
            if (oneFlag != null)
            {
                if (delete)
                {
                    _db.TH_UFL_User_Flag.DeleteObject(oneFlag);
                    _db.SaveChanges();
                }
                else
                {
                    oneFlag.ufl_d_update = DateTime.Now;
                    oneFlag.ufl_comment = btnClass;
                    _db.TH_UFL_User_Flag.ApplyCurrentValues(oneFlag);
                    _db.SaveChanges();
                }
            }
            else
            {
                if (!delete)
                {
                    oneFlag = new TH_UFL_User_Flag
                    {
                        usr_id = usrId,
                        ufl_comment = btnClass,
                        ufl_d_creation = DateTime.Now,
                        ufl_d_update = DateTime.Now,
                        ufl_fk_id = fkId,
                        ufl_fk_name = fkName
                    };
                    _db.TH_UFL_User_Flag.AddObject(oneFlag);
                    _db.SaveChanges();
                }
            }
            return GetUserFlag(usrId, fkName, fkId);
        }
    }
}
