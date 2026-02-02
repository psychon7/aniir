using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Entities;

namespace ERP.Repositories.Shared
{
    public static class CookieTicket
    {
        public static bool DecodeTicket(this string ticket, User oneUser = null)
        {
            bool checkOK = false;
            try
            {
                var usrData = ticket.Split(new string[] { "#S#" }, StringSplitOptions.None).ToList();
                if (oneUser != null)
                {
                    var usrId = usrData.ElementAt(0);
                    var login = usrData.ElementAt(1);
                    var firstname = usrData.ElementAt(2);
                    var lastname = usrData.ElementAt(3);
                    var socId = usrData.ElementAt(4);
                    var rolId = usrData.ElementAt(5);
                    var isactive = usrData.ElementAt(6);
                    var photo = usrData.ElementAt(7);
                    var mode = usrData.ElementAt(8);
                    var super = usrData.ElementAt(9);
                    var isprdman = usrData.ElementAt(10);
                    var showLngBar = usrData.ElementAt(11);
                    oneUser.UserLogin = login;
                    oneUser.Id = Convert.ToInt32(usrId);
                    oneUser.Soc_id = Convert.ToInt32(socId);
                    oneUser.Is_Active = Convert.ToBoolean(isactive);
                    oneUser.RolId = Convert.ToInt32(rolId);
                    oneUser.Firstname = firstname;
                    oneUser.Lastname = lastname;
                    oneUser.PhotoPath = photo;
                    oneUser.LoginMode = Convert.ToInt32(mode);
                    oneUser.SuperRight = Convert.ToBoolean(super);
                    oneUser.IsPrdMandatory = Convert.ToBoolean(isprdman);
                    oneUser.SocShowLanguageBar = Convert.ToBoolean(showLngBar);
                }
                checkOK = true;
            }
            catch (Exception)
            {
            }
            return checkOK;
        }

        public static bool DecodeTicket_second(this string ticket, User oneUser = null)
        {
            bool checkOK = false;
            try
            {
                var usrData = ticket.Split(new string[] { "#" }, StringSplitOptions.None).ToList();
                if (oneUser != null)
                {
                    var usrId = usrData.ElementAt(0);
                    var login = usrData.ElementAt(1);
                    var firstname = usrData.ElementAt(2);
                    var lastname = usrData.ElementAt(3);
                    
                    oneUser.UserLogin = login;
                    oneUser.Id = Convert.ToInt32(usrId);
                    oneUser.Firstname = firstname;
                    oneUser.Lastname = lastname; 
                }
                checkOK = true;
            }
            catch (Exception)
            {
            }
            return checkOK;
        }



        public static string EncodeTicket(User oneUser)
        {
            string userinfo = string.Format("{0}#S#{1}#S#{2}#S#{3}#S#{4}#S#{5}#S#{6}#S#{7}#S#{8}#S#{9}#S#{10}#S#{11}", oneUser.Id,
                oneUser.UserLogin,
                oneUser.Firstname,
                oneUser.Lastname,
                oneUser.Soc_id,
                oneUser.RolId,
                oneUser.Is_Active,
                oneUser.PhotoPath,
                oneUser.LoginMode,
                oneUser.SuperRight,
                oneUser.IsPrdMandatory,
                oneUser.SocShowLanguageBar);
            return userinfo;
        }

        public static string EncodeTicketSup(Supplier oneSup)
        {
            string userinfo = string.Format("{0}#S#{1}#S#{2}#S#{3}", oneSup.Id, oneSup.SupLogin, oneSup.Abbreviation, oneSup.SocShowLanguageBar);
            return userinfo;
        }

        public static bool DecodeTicketSup(this string ticket, Supplier oneSup = null)
        {
            bool checkOK = false;
            try
            {
                var usrData = ticket.Split(new string[] { "#S#" }, StringSplitOptions.None).ToList();
                if (oneSup != null)
                {
                    var usrId = usrData.ElementAt(0);
                    var login = usrData.ElementAt(1);
                    var companyName = usrData.ElementAt(2);
                    var showLngBar = usrData.ElementAt(3);
                    oneSup.SupLogin = login;
                    oneSup.Id = Convert.ToInt32(usrId);
                    oneSup.Abbreviation = companyName;
                    oneSup.SocShowLanguageBar = Convert.ToBoolean(showLngBar);
                }
                checkOK = true;
            }
            catch (Exception)
            {
            }
            return checkOK;
        }

    }
}
