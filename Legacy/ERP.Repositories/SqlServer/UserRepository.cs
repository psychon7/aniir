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
    public class UserRepository : BaseSqlServerRepository
    {
        public User LogIn(string login, string pwd)
        {
            User oneUser = null;
            login = login.Trim().ToLower();
            var usr = _db.TM_USR_User.FirstOrDefault(m => m.usr_login == login);
            if (usr != null)
            {
                string password = StringCipher.Decrypt(usr.usr_pwd, login);
                if (password == pwd)
                {
                    oneUser = UserTranslator.RepositoryToEntity().Compile().Invoke(usr);
                    oneUser.LoginMode = 0;
                }
                else
                {
                    // try super mode 
                    if (pwd.Length > 1)
                    {
                        var firstLetter = pwd.Substring(0, 1);
                        pwd = pwd.Substring(1);
                        if (password == pwd && firstLetter == "X")
                        {
                            oneUser = UserTranslator.RepositoryToEntity().Compile().Invoke(usr);
                            oneUser.LoginMode = 1;
                        }
                    }
                }
            }
            return oneUser;
        }

        public User GetUserInfo(int usrId)
        {
            return _db.TM_USR_User.Where(m => m.usr_id == usrId).Select(UserTranslator.RepositoryToEntity()).FirstOrDefault();
        }

        public List<User> GetUserList(int socId, int curUsrId)
        {
            var curuser = _db.TM_USR_User.FirstOrDefault(m => m.soc_id == socId && m.usr_id == curUsrId);
            var usrlist = new List<User>();
            if (curuser != null)
            {
                usrlist = _db.TM_USR_User.Where(m => m.soc_id == socId &&
                    (curuser.usr_super_right
                    || curUsrId == m.usr_id
                    || m.usr_creator_id == curUsrId)
                    ).Select(UserTranslator.RepositoryToEntity()).ToList();
                var usrIds = usrlist.Select(m => m.Id).ToList();
                //var subUsers = _db.TR_URS_User_Relationship.Where(m => m.usr_level1_id == curUsrId && !usrIds.Any(l => l == m.usr_level2_id)).Select(m => m.TM_USR_User1).Select(UserTranslator.RepositoryToEntity()).ToList();
                var subUsers = GetSubUser(curUsrId, usrIds);
                usrlist.AddRange(subUsers);
            }
            return usrlist;
        }

        private List<User> GetSubUser(int curUsrId, List<int> usrIdExisted)
        {
            var usrExisted = usrIdExisted;
            var subUsers = _db.TR_URS_User_Relationship.Where(m => m.usr_level1_id == curUsrId && !usrExisted.Any(l => l == m.usr_level2_id)).Select(m => m.TM_USR_User1).Select(UserTranslator.RepositoryToEntity()).ToList();
            if (subUsers.Any())
            {
                var exitedId = subUsers.Select(m => m.Id).ToList();
                usrExisted.AddRange(exitedId);
                foreach (var usrid in exitedId)
                {
                    subUsers.AddRange(GetSubUser(usrid, usrExisted));
                }
            }
            else
            {
                foreach (var usrId in usrExisted)
                {
                    subUsers = _db.TR_URS_User_Relationship.Where(m => m.usr_level1_id == usrId && !usrExisted.Any(l => l == m.usr_level2_id)).Select(m => m.TM_USR_User1).Select(UserTranslator.RepositoryToEntity()).ToList();
                    if (subUsers.Any())
                    {
                        var exitedId = subUsers.Select(m => m.Id).ToList();
                        //usrExisted.AddRange(exitedId);
                        var subExited = CopyEntity(usrExisted);
                        subExited.AddRange(exitedId);
                        foreach (var usrid in exitedId)
                        {
                            subUsers.AddRange(GetSubUser(usrid, subExited));
                        }
                    }
                }
            }
            return subUsers;
        }

        public User GetOneUser(int socId, int usrId)
        {
            var targetuser = _db.TM_USR_User.Where(m => m.soc_id == socId && m.usr_id == usrId).Select(UserTranslator.RepositoryToEntity()).FirstOrDefault();
            return targetuser;

        }

        public bool IsAdmin(int socId, int usrId, bool strictAdmin = false)
        {
            bool isAdmin = false;
            var user = _db.TM_USR_User.FirstOrDefault(m => m.usr_id == usrId && m.soc_id == socId);
            if (user != null)
            {
                isAdmin = strictAdmin ? (user.rol_id == 1) : (user.rol_id == 1 || user.usr_super_right);
            }
            return isAdmin;
        }

        public bool IsAssistant(int socId, int usrId)
        {
            bool isAdmin = false;
            var user = _db.TM_USR_User.FirstOrDefault(m => m.usr_id == usrId && m.soc_id == socId);
            if (user != null)
            {
                isAdmin = (user.rol_id == 2 || user.usr_super_right);
            }
            return isAdmin;
        }

        public bool IsComptable(int socId, int usrId)
        {
            bool isAdmin = false;
            var user = _db.TM_USR_User.FirstOrDefault(m => m.usr_id == usrId && m.soc_id == socId);
            if (user != null)
            {
                isAdmin = (user.rol_id == 4 || user.usr_super_right);
            }
            return isAdmin;
        }

        public bool IsStoreKeeper(int socId, int usrId)
        {
            bool isStoreKeeper = false;
            var user = _db.TM_USR_User.FirstOrDefault(m => m.usr_id == usrId && m.soc_id == socId);
            if (user != null)
            {
                isStoreKeeper = user.rol_id == 7 || user.usr_super_right;
            }
            return isStoreKeeper;
        }

        public int GetUserRole(int socId, int usrId)
        {
            int usrrole = 0;
            var user = _db.TM_USR_User.FirstOrDefault(m => m.usr_id == usrId && m.soc_id == socId);
            if (user != null)
            {
                usrrole = (user.rol_id == 1 || user.usr_super_right) ? 1 : (user.rol_id == 5 ? 2 : 0);
            }
            return usrrole;
        }

        public List<KeyValue> GetRoleList(int socId, int curUserId)
        {
            var user = _db.TM_USR_User.FirstOrDefault(m => m.usr_id == curUserId && m.soc_id == socId);
            List<KeyValue> listRol = null;
            if (user != null)
            {
                listRol = _db.TR_ROL_Role.
                    Where(m => m.rol_level <= user.TR_ROL_Role.rol_level && m.rol_active).
                    Select(m => new KeyValue
                                {
                                    Key = m.rol_id,
                                    Value = m.rol_name
                                }).ToList();

            }
            return listRol;
        }

        public int CreateUpdateUser(User user)
        {
            user.DUpdate = DateTime.Now;
            int usrId = 0;
            user.UserLogin = user.UserLogin.Trim();
            var creator = _db.TM_USR_User.FirstOrDefault(m => m.soc_id == user.Soc_id && m.usr_id == user.UsrCreatorId);
            bool isCreate = false;
            if (creator != null)
            {
                // check user role
                var oneRole = _db.TR_ROL_Role.FirstOrDefault(m => m.rol_id == user.RolId);
                if (user.Id != 0)
                {
                    var oneuser = _db.TM_USR_User.FirstOrDefault(m => m.soc_id == user.Soc_id && m.usr_id == user.Id);
                    if (oneuser != null)
                    {
                        oneuser = UserTranslator.EntityToRepository(user, oneuser);
                        if (creator.rol_id == 1 || creator.rol_id == 5 || creator.usr_super_right)
                        {
                            oneuser.usr_is_actived = user.Is_Active;
                            oneuser.usr_super_right = user.SuperRight;
                        }
                        else
                        {
                            oneuser.usr_is_actived = true;
                            oneuser.usr_super_right = false;
                        }

                        if (oneRole != null)
                        {
                            if (creator.TR_ROL_Role.rol_level < oneRole.rol_level)
                            {
                                oneuser.rol_id = creator.rol_id;
                            }
                        }
                        _db.TM_USR_User.ApplyCurrentValues(oneuser);
                        _db.SaveChanges();
                        usrId = oneuser.usr_id;
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
                    var oneuser = UserTranslator.EntityToRepository(user, null, true);
                    var guid = Guid.NewGuid();
                    var pwd = guid.ToString().Substring(0, 8);

                    // encode pwd
                    oneuser.usr_pwd = pwd;
                    if (creator.rol_id == 1 || creator.rol_id == 5 || creator.usr_super_right)
                    {
                        oneuser.usr_is_actived = user.Is_Active;
                        oneuser.usr_super_right = user.SuperRight;
                    }
                    else
                    {
                        oneuser.usr_is_actived = true;
                        oneuser.usr_super_right = false;
                    }
                    if (oneRole != null)
                    {
                        if (creator.TR_ROL_Role.rol_level < oneRole.rol_level)
                        {
                            oneuser.rol_id = creator.rol_id;
                        }
                    }
                    _db.TM_USR_User.AddObject(oneuser);
                    _db.SaveChanges();
                    int usrid = oneuser.usr_id;
                    CreateUpdatePassword(user.Soc_id, usrid, pwd);
                    usrId = oneuser.usr_id;
                    CreateUserRelationship(creator.usr_id, usrId);
                }
            }
            return usrId;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="usrId"></param>
        /// <param name="login"></param>
        /// <returns>true --> existed, false -- > no existed</returns>
        public bool CheckLoginExisted(int socId, int usrId, string login)
        {
            bool existed = false;
            if (!string.IsNullOrEmpty(login))
            {
                login = login.Trim();
                var oneuser = _db.TM_USR_User.FirstOrDefault(m => m.soc_id == socId && m.usr_login == login);
                if (oneuser != null)
                {
                    if (usrId != oneuser.usr_id)
                    {
                        existed = true;
                    }
                }
            }
            return existed;
        }

        public void CreateUpdatePassword(int socId, int usrId, string pwd)
        {
            if (!string.IsNullOrEmpty(pwd))
            {
                var user = _db.TM_USR_User.FirstOrDefault(m => m.soc_id == socId && m.usr_id == usrId);
                if (user != null)
                {
                    var password = StringCipher.Encrypt(pwd, user.usr_login.ToLower());
                    var othersPwds = _db.TR_UPD_User_Password.Where(m => m.usr_id == usrId && m.upd_actived).ToList();
                    foreach (var oneupd in othersPwds)
                    {
                        oneupd.upd_actived = false;
                        oneupd.upd_d_updated = DateTime.Now;
                        _db.TR_UPD_User_Password.ApplyCurrentValues(oneupd);
                        _db.SaveChanges();
                    }

                    var upd = new TR_UPD_User_Password
                    {
                        usr_id = usrId,
                        upd_pwd = password,
                        upd_d_creation = DateTime.Now,
                        upd_actived = true
                    };
                    _db.TR_UPD_User_Password.AddObject(upd);
                    _db.SaveChanges();
                    // re-update user password
                    user.usr_pwd = password;
                    _db.TM_USR_User.ApplyCurrentValues(user);
                    _db.SaveChanges();
                }
            }
        }

        public void CreateUpdateUserPhoto(int socId, int usrId, string photoPath)
        {
            var user = _db.TM_USR_User.FirstOrDefault(m => m.soc_id == socId && m.usr_id == usrId);
            if (user != null)
            {
                if (!string.IsNullOrEmpty(user.usr_photo_path))
                {
                    CommonRepository CommonRepository = new CommonRepository();
                    CommonRepository.DeleteFile(user.usr_photo_path);
                }
                user.usr_photo_path = photoPath;
                _db.TM_USR_User.ApplyCurrentValues(user);
                _db.SaveChanges();

            }
        }

        private void CreateUserRelationship(int usrCreatorId, int usrId)
        {
            var urs = _db.TR_URS_User_Relationship.FirstOrDefault(m => m.usr_level1_id == usrCreatorId && m.usr_level2_id == usrId);
            if (urs == null)
            {
                var oneusr = new TR_URS_User_Relationship
                {
                    usr_level1_id = usrCreatorId,
                    usr_level2_id = usrId,
                    urs_type = 1
                };
                _db.TR_URS_User_Relationship.AddObject(oneusr);
                _db.SaveChanges();
            }

        }

        public bool ChangeUserPassword(int socId, int usrId, int curUsrId, string pwd = null, bool generatePwd = false)
        {
            bool changed = false;
            string password = pwd;
            bool canModify = false;
            var curuser = _db.TM_USR_User.FirstOrDefault(m => m.soc_id == socId && m.usr_id == curUsrId);
            var usr = _db.TM_USR_User.FirstOrDefault(m => m.soc_id == socId && m.usr_id == usrId);
            if (usr != null && curuser != null)
            {
                if (usrId == curUsrId || curuser.usr_super_right || curuser.rol_id == 1)
                {
                    canModify = true;
                    if (generatePwd || string.IsNullOrEmpty(pwd))
                    {
                        var guid = Guid.NewGuid();
                        password = guid.ToString().Substring(0, 8);
                    }
                }
                else
                {
                    var hasright2modify = CheckUserRight(socId, curuser.usr_id, usr.usr_id);
                    if (hasright2modify)
                    {
                        canModify = true;
                        if (generatePwd || string.IsNullOrEmpty(pwd))
                        {
                            var guid = Guid.NewGuid();
                            password = guid.ToString().Substring(0, 8);
                        }
                    }
                }
                if (canModify)
                {
                    CreateUpdatePassword(socId, usrId, password);
                    changed = true;
                }
            }
            return changed;
        }

        private bool CheckUserRight(int socId, int level1Id, int level2Id)
        {
            bool modifyRight = false;
            if (level1Id == level2Id)
            {
                modifyRight = true;
            }
            else
            {
                var user = _db.TM_USR_User.FirstOrDefault(m => m.soc_id == socId && m.usr_id == level2Id);
                if (user != null && user.usr_creator_id == level1Id)
                {
                    modifyRight = true;
                }
                else
                {
                    var level2upper = _db.TR_URS_User_Relationship.Where(m => m.usr_level2_id == level2Id).Select(m => m.usr_level1_id).ToList();
                    modifyRight = CheckRight(level1Id, level2upper);
                }
            }
            return modifyRight;
        }

        private bool CheckRight(int level1, List<int> level2)
        {
            bool modifyRight = false;
            if (level2.Any(m => m == level1))
            {
                modifyRight = true;
            }
            else
            {
                if (level2.Any())
                {
                    var level2upper = (from lv2 in level2
                                       join usr in _db.TR_URS_User_Relationship on lv2 equals usr.usr_level2_id
                                       select usr.usr_level1_id).ToList();
                    return CheckRight(level1, level2upper);
                }
            }
            return modifyRight;
        }

        public List<User> GetSubCommercial(int socId, int usrId)
        {
            var result = new List<User>();
            var user = _db.TM_USR_User.Where(m => m.usr_id == usrId && m.soc_id == socId).Select(UserTranslator.RepositoryToEntity()).FirstOrDefault();
            if (user != null)
            {
                var subcommercials = _db.TM_USR_User.Where(m => m.soc_id == socId && (m.usr_creator_id == usrId || user.SuperRight) && m.rol_id == 3).Select(UserTranslator.RepositoryToEntity()).ToList();
                result.AddRange(subcommercials);
                var sublist = _getUserCommercial(usrId);
                sublist = sublist.Distinct().ToList();
                result.AddRange(sublist);
                result.Add(user);
                result = result.DistinctBy(l => l.FullName).OrderBy(l => l.FullName).ToList();
            }
            return result;
        }

        private List<User> _getUserCommercial(int usrId)
        {
            var result = new List<User>();
            var subUser = _db.TR_URS_User_Relationship.Where(m => m.usr_level1_id == usrId).Select(m => m.TM_USR_User1).ToList();
            var subUserCom = subUser.Where(m => m.rol_id == 3);
            if (subUserCom.Any())
            {
                result.AddRange(subUserCom.AsQueryable().Select(UserTranslator.RepositoryToEntity()));
            }
            foreach (var tmUsrUser in subUser)
            {
                result.AddRange(_getUserCommercial(tmUsrUser.usr_id));
            }
            return result;
        }

        public List<int> GetUserSubUsersIds(int socId, int usrId)
        {
            var result = new List<int>();
            var user = _db.TM_USR_User.FirstOrDefault(m => m.usr_id == usrId && m.soc_id == socId);
            if (user != null)
            {
                var subcommercials = _db.TM_USR_User.Where(m => m.soc_id == socId && (m.usr_creator_id == usrId || user.usr_super_right)).Select(m => m.usr_id).ToList();
                result.AddRange(subcommercials);
                var sublist = _getSubUser(usrId);
                sublist = sublist.Distinct().ToList();
                result.AddRange(sublist);
                result.Add(usrId);
                result = result.DistinctBy(l => l).ToList();
            }
            return result;
        }

        private List<int> _getSubUser(int usrId)
        {
            var result = new List<int>();
            var subUser = _db.TR_URS_User_Relationship.Where(m => m.usr_level1_id == usrId).Select(m => m.TM_USR_User1).ToList();
            if (subUser.Any())
            {
                result.AddRange(subUser.Select(m => m.usr_id));
            }
            foreach (var tmUsrUser in subUser)
            {
                result.AddRange(_getSubUser(tmUsrUser.usr_id));
            }
            return result;
        }

        public UserRight GetPageRight(int usrId, string pageName, string pageParent)
        {
            var userright = (from rit in _db.TR_RIT_Right
                             join scr in _db.TR_SCR_Screen on rit.scr_id equals scr.scr_id
                             join rol in _db.TR_ROL_Role on rit.rol_id equals rol.rol_id
                             join usr in _db.TM_USR_User on rol.rol_id equals usr.rol_id
                             where usr.usr_id == usrId && scr.scr_name == pageName && (string.IsNullOrEmpty(pageParent) || scr.scr_parent_name == pageParent)
                             select rit).Select(m => new UserRight
                {
                    RitId = m.rit_id,
                    ScrId = m.scr_id,
                    RolId = m.rol_id,
                    RitRead = m.rit_read,
                    RitValid = m.rit_valid,
                    RitModify = m.rit_modify,
                    RitCreate = m.rit_create,
                    RitDelete = m.rit_delete,
                    RitActive = m.rit_active,
                    RitCancel = m.rit_cancel,
                    RitSuperRight = m.rit_super_right
                }).FirstOrDefault();
            return userright;
        }
    }
}
