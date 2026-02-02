using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Entities;
using ERP.Repositories.SqlServer;

namespace ERP.DataServices
{
    public class UserHServices : UserHRepository
    {
        public UserCommentFlagH GetCostPlanComment(int usrId, int cplId)
        {
            return GetUserComment(usrId, "cpl_id", cplId);
        }

        public UserCommentFlagH GetCostPlanFlag(int usrId, int cplId)
        {
            return GetUserFlag(usrId, "cpl_id", cplId);
        }
    }
}
