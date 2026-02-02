using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace ERP.Entities
{
    [Serializable]
    public class User : BaseClass
    {
        /// <summary>
        /// L'id d'entité User(Utilisateur) (int)
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// La date de mis à jour (datetime)
        /// </summary>
        public DateTime DUpdate { get; set; }

        /// <summary>
        /// Le nom et prénnom (nvarchar 40)
        /// </summary>
        public string Firstname { get; set; }

        /// <summary>
        /// Le nom et prénnom (nvarchar 40)
        /// </summary>
        public string Lastname { get; set; }

        /// <summary>
        /// Le nom complete
        /// </summary>
        public string FullName
        {
            get { return string.Format("{0} {1}", Firstname, Lastname); }
        }

        public string Title { get; set; }

        /// <summary>
        /// Le numéro de tel (nvarchar 20)
        /// </summary>
        public string Telephone { get; set; }

        /// <summary>
        /// Le numéro de fax (nvarchar 20)
        /// </summary>
        public string Fax { get; set; }

        /// <summary>
        /// Le numéro de mobile (nvarchar 20)
        /// </summary>
        public string Cellphone { get; set; }

        /// <summary>
        /// L'email (nvarchar 60)
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Le code RH (nvarchar 60)
        /// </summary>
        public string Code_HR { get; set; }

        /// <summary>
        /// L'indice d'actif (bool)
        /// </summary>
        public bool Is_Active { get; set; }

        public string PhotoPath { get; set; }

        public string Address1 { get; set; }
        public string Address2 { get; set; }
        public string PostCode { get; set; }
        public string Country { get; set; }
        public bool SuperRight { get; set; }

        public int RolId { get; set; }

        /// <summary>
        /// Le login d'utilisateur
        /// </summary>
        public string UserLogin { get; set; }
        public string UserPassword { get; set; }
        public int Soc_id { get; set; }

        /// <summary>
        /// L'id d'entité Civility
        /// </summary>
        public int Civ_Id { get; set; }

        /// <summary>
        /// L'entiété Société
        /// </summary>
        public Society Society { get; set; }

        /// <summary>
        /// L'entité Civility
        /// </summary>
        public KeyValue Civility { get; set; }

        public string RoleName { get; set; }

        public string City { get; set; }

        /// <summary>
        /// Creator Id
        /// </summary>
        public int? UsrCreatorId { get; set; }

        /// <summary>
        /// Creator
        /// </summary>
        public KeyValue Creator { get; set; }

        /// <summary>
        /// Creation Date
        /// </summary>
        public DateTime DCreation { get; set; }

        public string UsrComment { get; set; }

        public string PwdActived { get; set; }

        public string NameFirstLetter
        {
            get
            {
                string result = "汉";
                try
                {
                    string firstletter = Firstname.Substring(0, 1).ToUpperInvariant();
                    if (Regex.IsMatch(firstletter, "^[a-zA-Z0-9]*$"))
                    {
                        result = firstletter;
                    }
                }
                catch (Exception ex)
                {
                }
                return result;
            }
        }

        public bool IsAdmin
        {
            get { return RolId == 1 || RolId == 5 || SuperRight; }
        }

        public bool RcvPurchaseNotif { get; set; }

        /// <summary>
        /// for society
        /// </summary>
        public bool IsPrdMandatory { get; set; }
        /// <summary>
        /// TR_SOC 表中的 ShowLanguageBar
        /// </summary>
        public bool SocShowLanguageBar { get; set; }
    }
}
