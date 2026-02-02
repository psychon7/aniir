using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.Extensions
{
    public static class Extensions
    {
        public static IList<T> Clone<T>(this IList<T> listToClone) where T : ICloneable
        {
            return listToClone.Select(item => (T)item.Clone()).ToList();
        }

        public static IEnumerable<TSource> DistinctBy<TSource, TKey>(this IEnumerable<TSource> source, Func<TSource, TKey> keySelector)
        {
            HashSet<TKey> seenKeys = new HashSet<TKey>();
            return source.Where(element => seenKeys.Add(keySelector(element)));
        }

        public static IEnumerable<TM_CPL_Cost_Plan> FilterCostPlanUser(this IEnumerable<TM_CPL_Cost_Plan> source, bool isAdmin, int usrId, List<int> subUsers)
        {
            return source.Where(m => isAdmin
                                     || m.usr_creator_id == usrId
                                     || m.usr_commercial1 == usrId
                                     || m.usr_commercial2 == usrId
                                     || m.usr_commercial3 == usrId
                                     || subUsers.Any(l => l == m.usr_creator_id)
                                     || subUsers.Any(l => l == m.usr_commercial1)
                                     || subUsers.Any(l => l == m.usr_commercial2)
                                     || subUsers.Any(l => l == m.usr_commercial3));
        }

        public static IEnumerable<TM_COD_Client_Order> FilterClientOrderUser(this IEnumerable<TM_COD_Client_Order> source, bool isAdmin, bool isStoreKeeper, int usrId, List<int> subUsers)
        {
            return source.Where(m => isAdmin
                || isStoreKeeper
                                     || m.usr_creator_id == usrId
                                     || m.usr_com_1 == usrId
                                     || m.usr_com_2 == usrId
                                     || m.usr_com_3 == usrId
                                     || subUsers.Any(l => l == m.usr_creator_id)
                                     || subUsers.Any(l => l == m.usr_com_1)
                                     || subUsers.Any(l => l == m.usr_com_2)
                                     || subUsers.Any(l => l == m.usr_com_3));
        }

        public static IEnumerable<TM_DFO_Delivery_Form> FilterDfoUser(this IEnumerable<TM_DFO_Delivery_Form> source, bool isAdmin, bool isStoreKeeper, int usrId, List<int> subUsers)
        {
            return source.Where(m => isAdmin
                || isStoreKeeper
                                     || m.usr_creator_id == usrId
                                     || m.TM_COD_Client_Order.usr_com_1 == usrId
                                     || m.TM_COD_Client_Order.usr_com_2 == usrId
                                     || m.TM_COD_Client_Order.usr_com_3 == usrId
                                     || subUsers.Any(l => l == m.usr_creator_id)
                                     || subUsers.Any(l => l == m.TM_COD_Client_Order.usr_com_1)
                                     || subUsers.Any(l => l == m.TM_COD_Client_Order.usr_com_2)
                                     || subUsers.Any(l => l == m.TM_COD_Client_Order.usr_com_3));
        }

        public static IEnumerable<TM_CIN_Client_Invoice> FilterClientInvoiceUser(this IEnumerable<TM_CIN_Client_Invoice> source, bool isAdmin, int usrId, List<int> subUsers)
        {
            return source.Where(m => isAdmin
                                     || m.usr_creator_id == usrId
                                     || m.usr_com_1 == usrId
                                     || m.usr_com_2 == usrId
                                     || m.usr_com_3 == usrId
                                     || subUsers.Any(l => l == m.usr_creator_id)
                                     || subUsers.Any(l => l == m.usr_com_1)
                                     || subUsers.Any(l => l == m.usr_com_2)
                                     || subUsers.Any(l => l == m.usr_com_3));
        }


    }

    /// <summary>
    /// Reference Article http://www.codeproject.com/KB/tips/SerializedObjectCloner.aspx
    /// Provides a method for performing a deep copy of an object.
    /// Binary Serialization is used to perform the copy.
    /// </summary>
    public static class ObjectCopier
    {
        /// <summary>
        /// Perform a deep Copy of the object.
        /// </summary>
        /// <typeparam name="T">The type of object being copied.</typeparam>
        /// <param name="source">The object instance to copy.</param>
        /// <returns>The copied object.</returns>
        public static T Clone<T>(T source)
        {
            if (!typeof(T).IsSerializable)
            {
                throw new ArgumentException("The type must be serializable.", "source");
            }

            // Don't serialize a null object, simply return the default for that object
            if (Object.ReferenceEquals(source, null))
            {
                return default(T);
            }

            IFormatter formatter = new BinaryFormatter();
            Stream stream = new MemoryStream();
            using (stream)
            {
                formatter.Serialize(stream, source);
                stream.Seek(0, SeekOrigin.Begin);
                return (T)formatter.Deserialize(stream);
            }
        }

        public static T DeepCopy<T>(T obj)
        {
            using (MemoryStream stream = new MemoryStream())
            {
                BinaryFormatter formatter = new BinaryFormatter();
                formatter.Serialize(stream, obj);
                stream.Position = 0;
                return (T)formatter.Deserialize(stream);
            }
        }

    }
}
