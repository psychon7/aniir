using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Objects.DataClasses;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Xml;
using System.Xml.Serialization;
using ERP.Entities;
using System.Globalization;
//using Microsoft.Office.Interop.Excel;

namespace ERP.Repositories.DataBase
{
    public class BaseSqlServerRepository : IDisposable
    {
        public CultureInfo culture = new CultureInfo("fr-FR");
        protected ERP_DBEntities _db { get; set; }
        public int _codeType = Convert.ToInt32(ConfigurationSettings.AppSettings["CodeType"]);

        public List<string> ProductTypeWithOutTSheet = new List<string> { "OPTION", "ACCESSOIRE", "DRIVER" };

        public BaseSqlServerRepository()
        {
            _db = new ERP_DBEntities();
        }

        public static T CopyEntity<T>(ERP_DBEntities ctx, T entity, bool copyKeys = false) where T : EntityObject
        {
            T clone = ctx.CreateObject<T>();
            PropertyInfo[] pis = entity.GetType().GetProperties();

            foreach (PropertyInfo pi in pis)
            {
                EdmScalarPropertyAttribute[] attrs = (EdmScalarPropertyAttribute[])
            pi.GetCustomAttributes(typeof(EdmScalarPropertyAttribute), false);

                foreach (EdmScalarPropertyAttribute attr in attrs)
                {
                    if (!copyKeys && attr.EntityKeyProperty)
                        continue;

                    pi.SetValue(clone, pi.GetValue(entity, null), null);
                }
            }
            return clone;
        }

        public static T CopyEntity<T>(T entity, bool copyKeys = false) where T : new()
        {
            T clone = new T();
            PropertyInfo[] pis = entity.GetType().GetProperties();

            foreach (PropertyInfo pi in pis)
            {
                EdmScalarPropertyAttribute[] attrs = (EdmScalarPropertyAttribute[])
            pi.GetCustomAttributes(typeof(EdmScalarPropertyAttribute), false);

                foreach (EdmScalarPropertyAttribute attr in attrs)
                {
                    if (!copyKeys && attr.EntityKeyProperty)
                        continue;

                    pi.SetValue(clone, pi.GetValue(entity, null), null);
                }
            }
            return clone;
        }

        /// <summary>
        /// 生成形如FA20209999999
        /// </summary>
        /// <param name="name"></param>
        /// <param name="lastRef"></param>
        /// <returns></returns>
        public string GetGeneralRefContinuationType1(string name, string lastRef)
        {
            // 有效数字长度为 7 位 最大值 9999999
            string newRef = string.Empty;
            string year = DateTime.Now.Year.ToString().Substring(2, 2);
            int num = 1;
            if (!string.IsNullOrEmpty(lastRef))
            {
                var number = lastRef.Substring(4, 7);
                num = Convert.ToInt32(number);
                num++;
            }
            newRef = string.Format("{0}{1}{2:d7}", name.ToUpper(), year, num);
            return newRef;
        }

        public string GetGeneralRefContinuation(DateTime dateCreation, string name, string lastRef, int type, int clisupId = 0)
        {
            var code = string.Empty;
            switch (type)
            {
                case 1:
                    {
                        code = GetGeneralRefContinuationType1(name, lastRef);
                    }
                    break;
                case 2:
                    {
                        code = GetGeneralRefContinuationType2(dateCreation, name, lastRef);
                    }
                    break;
                case 3:
                    {
                        code = GetGeneralRefContinuationType3(dateCreation, name, lastRef);
                    }
                    break;
                case 4:
                    {
                        code = GetGeneralRefContinuationType4(dateCreation, name, lastRef);
                    }
                    break;
                case 5:
                    {
                        code = GetGeneralRefContinuationType4(dateCreation, name, lastRef);
                    }
                    break;
            }
            return code;
        }

        /// <summary>
        /// 生成形如FA20129999
        /// </summary>
        /// <param name="dateCreation"></param>
        /// <param name="name"></param>
        /// <param name="lastRef"></param>
        /// <returns></returns>
        public string GetGeneralRefContinuationType2(DateTime dateCreation, string name, string lastRef)
        {
            // 有效数字长度为 7 位 最大值 9999999
            string newRef = string.Empty;
            string year = dateCreation.Year.ToString().Substring(2, 2);
            string month = string.Format("{0:d2}", dateCreation.Month);

            int num = 1;
            if (!string.IsNullOrEmpty(lastRef))
            {
                try
                {
                    var number = lastRef.Substring(6, 4);
                    num = Convert.ToInt32(number);
                    num++;
                }
                catch (Exception)
                {
                }
            }
            newRef = string.Format("{0}{1}{2}{3:d4}", name.ToUpper(), year, month, num);
            return newRef;
        }

        /// <summary>
        /// 生产形如FA202012999
        /// </summary>
        /// <param name="dateCreation"></param>
        /// <param name="name"></param>
        /// <param name="lastRef"></param>
        /// <returns></returns>
        public string GetGeneralRefContinuationType3(DateTime dateCreation, string name, string lastRef)
        {
            // 有效数字长度为 7 位 最大值 9999999
            string newRef = string.Empty;
            string year = dateCreation.Year.ToString().Substring(2, 2);
            string month = string.Format("{0:d2}", dateCreation.Month);

            int num = 1;
            if (!string.IsNullOrEmpty(lastRef))
            {
                try
                {
                    var number = lastRef.Substring(8, 4);
                    num = Convert.ToInt32(number);
                    num++;
                }
                catch (Exception)
                {
                }
            }
            newRef = string.Format("{0}{1}{2}{3:d4}", name.ToUpper(), year, month, num);
            return newRef;
        }

        /// <summary>
        /// 新规，英文首字母SO20092799999000
        /// </summary>
        /// <param name="dateCreation"></param>
        /// <param name="name"></param>
        /// <param name="lastRef"></param>
        /// <returns></returns>
        public string GetGeneralRefContinuationType4(DateTime dateCreation, string name, string lastRef)
        {
            // 有效数字长度为 7 位 最大值 9999999
            string newRef = string.Empty;
            string year = dateCreation.Year.ToString().Substring(2, 2);
            string month = string.Format("{0:d2}", dateCreation.Month);
            string day = string.Format("{0:d2}", dateCreation.Day);

            int num = 1;
            if (!string.IsNullOrEmpty(lastRef))
            {
                try
                {
                    var number = lastRef.Substring(13, 4);
                    num = Convert.ToInt32(number);
                    num++;
                }
                catch (Exception)
                {

                    // 
                    try
                    {
                        // 测试type2
                        var number = lastRef.Substring(8, 4);
                        num = Convert.ToInt32(number);
                        num++;
                    }
                    catch (Exception)
                    {
                        // 测试Type1 
                        try
                        {
                            var number = lastRef.Substring(4, 7);
                            num = Convert.ToInt32(number);
                            num++;
                        }
                        catch (Exception)
                        {

                            // 测试type3
                            try
                            {
                                var number = lastRef.Substring(6, 4);
                                num = Convert.ToInt32(number);
                                num++;
                            }
                            catch (Exception)
                            {
                            }
                        }
                    }
                }
            }
            newRef = string.Format("{0}{1}{2}{3}{4:d4}", name.ToUpper(), year, month, day, num);
            return newRef;
        }


        public int CheckCommune(string postcode, string city)
        {
            int returnvalue = 0;
            if (!string.IsNullOrEmpty(postcode) && !string.IsNullOrEmpty(city))
            {
                postcode = postcode.Replace(" ", "").Trim();
                city = city.ToLower().Trim();
                var cmu = _db.TR_CMU_Commune.FirstOrDefault(m => m.cmu_postcode == postcode && m.cmu_name == city);
                if (cmu != null)
                {
                    returnvalue = cmu.cmu_id;
                }
            }
            return returnvalue;
        }

        public static string Serialize<T>(T value)
        {
            if (value == null)
            {
                return string.Empty;
            }
            try
            {
                var xmlserializer = new XmlSerializer(typeof(T));
                var stringWriter = new StringWriter();
                using (var writer = XmlWriter.Create(stringWriter))
                {
                    xmlserializer.Serialize(writer, value);
                    return stringWriter.ToString();
                }
            }
            catch (Exception ex)
            {
                throw new Exception("An error occurred", ex);
            }
        }

        public static Guid CheckAndParseGuid(string guidString)
        {
            Guid guid;
            if (guidString == null)
            {
                //throw new ArgumentNullException("guidString");
                guid = Guid.NewGuid();
                return guid;
            }
            try
            {
                guid = new Guid(guidString);
                return guid;
            }
            catch (FormatException)
            {
                guid = Guid.NewGuid();
                return guid;
            }
        }

        public double Rounding_Int(double value)
        {
            return Math.Round(value, 0, MidpointRounding.AwayFromZero);
        }

        public DateTime CreateDateWithTime(DateTime dateTime)
        {
            try
            {
                var now = DateTime.Now;
                var newdate = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, now.Hour, now.Minute, now.Second);
                return newdate;
            }
            catch (Exception)
            {
                return dateTime;
            }
        }

        /// <summary>
        /// 获得编码首字母
        /// </summary>
        /// <param name="codeType">1: Cin, 2: Cod, 3: Cpl Devis, 4: Prj, 5: Delivery, 6: Purchase Intent, 7: Sod, 8: Sin, 9: Client, 10: Supplier, 11: Shipping Receive, 12: CLient Contact, 
        /// 13: Supplier Contact, 14: Avoir, 15: Logistic, 16: Destinataire</param>
        /// <returns></returns>
        public string GetCodePref(int codeType)
        {
            var pref = string.Empty;
            switch (codeType)
            {
                case 1: { pref = _codeType == 4 ? "CI" : _codeType == 5 ? "IN" : "FA"; } break;
                case 2: { pref = _codeType == 4 ? "CO" : _codeType == 5 ? "OR" : "BC"; } break;
                case 3: { pref = _codeType == 4 ? "QO" : _codeType == 5 ? "QT" : "DV"; } break;
                case 4: { pref = _codeType == 4 ? "PJ" : _codeType == 5 ? "PR" : "PJ"; } break;
                case 5: { pref = _codeType == 4 ? "DF" : _codeType == 5 ? "DL" : "BL"; } break;
                case 6: { pref = _codeType == 4 ? "PI" : _codeType == 5 ? "PI" : "IA"; } break;
                case 7: { pref = _codeType == 4 ? "SO" : _codeType == 5 ? "SD" : "CF"; } break;
                case 8: { pref = _codeType == 4 ? "SI" : _codeType == 5 ? "SI" : "FF"; } break;
                case 9: { pref = _codeType == 4 ? "CL" : _codeType == 5 ? "CI" : "CL"; } break;
                case 10: { pref = _codeType == 4 ? "SU" : _codeType == 5 ? "SP" : "FN"; } break;
                case 11: { pref = _codeType == 4 ? "SR" : _codeType == 5 ? "RC" : "SR"; } break;
                case 12: { pref = _codeType == 4 ? "CC" : _codeType == 5 ? "CN" : "CT"; } break;
                case 13: { pref = _codeType == 4 ? "SC" : _codeType == 5 ? "SN" : "SC"; } break;
                case 14: { pref = _codeType == 4 ? "CN" : _codeType == 5 ? "NT" : "AV"; } break;
                case 15: { pref = _codeType == 4 ? "LG" : _codeType == 5 ? "LG" : "LG"; } break;
                case 16: { pref = _codeType == 4 ? "CS" : _codeType == 5 ? "CS" : "DS"; } break;
                default: break;
            }
            return pref;
        }

        /// <summary>
        /// 父类实例给子类实例赋值
        /// </summary>
        /// <typeparam name="TParent"></typeparam>
        /// <typeparam name="TChild"></typeparam>
        /// <param name="parent"></param>
        /// <returns></returns>
        public static TChild AutoCopy<TParent, TChild>(TParent parent) where TChild : TParent, new()
        {
            TChild child = new TChild();
            var parentType = typeof(TParent);
            var properties = parentType.GetProperties();
            foreach (var propertie in properties)
            {
                //循环遍历属性
                if (propertie.CanRead && propertie.CanWrite)
                {
                    //进行属性拷贝
                    propertie.SetValue(child, propertie.GetValue(parent, null), null);
                }
            }
            return child;
        }

        #region IDisposable
        private Boolean disposedValue = false;
        /// <summary>
        /// Disposer et fermer la connexion
        /// </summary>
        /// <param name="disposing">L'indice de disposer, true: disposer ; false: contraire</param>
        protected void Dispose(Boolean disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    _db.Dispose();
                    _db = null;
                }
            }
            disposedValue = true;
        }
        /// <summary>
        /// Disposer et fermer la connexion et collectionner les déchets
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
        #endregion
    }
}
