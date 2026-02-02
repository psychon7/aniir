using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Web.UI;
using System.Xml;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer
{
    public class MessageRepository : BaseSqlServerRepository
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="usrId"></param>
        /// <param name="fkName"></param>
        /// <param name="fkId"></param>
        /// <param name="type">1 memo, 2 todolist</param>
        /// <returns></returns>
        public List<Message> GetMessages(int usrId, string fkName, int fkId, int type)
        {
            if (!string.IsNullOrEmpty(fkName))
            {
                switch (fkName)
                {
                    // todo: all table   

                }
            }
            else
            {
                if (type == 1)
                {
                    var msgs = _db.TI_MSG_Message.Where(m => m.usr_id == usrId && m.msg_is_memo).ToList();

                }
            }
            return null;
        }

        public Message CreateUpdateMessage(Message oneMessage, bool updateStatus)
        {
            var result = new Message();
            var onemsg = _db.TI_MSG_Message.FirstOrDefault(m => m.msg_id == oneMessage.Id);
            if (oneMessage.IsToDo && onemsg == null)
            {
                onemsg = _db.TI_MSG_Message.FirstOrDefault(m => m.usr_id == oneMessage.UsrId);
            }
            if (onemsg != null)
            {
                var oldmsgItems = GetMessageItems(onemsg.msg_id, onemsg.msg_content);
                //oldmsgItems = oneMessage.AllMessages.Aggregate(oldmsgItems, CreateUpdateMsgItem);
                oldmsgItems = oneMessage.AllMessages.Aggregate(oldmsgItems, (current, messageItem) => CreateUpdateMsgItem(current, messageItem, updateStatus));
                var mgsXml = GenerateXmlField(oldmsgItems);
                onemsg.msg_content = mgsXml;
                _db.TI_MSG_Message.ApplyCurrentValues(onemsg);
                _db.SaveChanges();
                result = new Message
                {
                    Id = onemsg.msg_id,
                    UsrId = onemsg.usr_id,
                    DCreation = onemsg.msg_d_creation,
                    FkId = onemsg.msg_fk_id,
                    FkName = onemsg.msg_fk_name,
                    IsMemo = onemsg.msg_is_memo,
                    IsToDo = onemsg.msg_is_td,
                    AllMessages = GetMessageItems(onemsg.msg_id, onemsg.msg_content)
                };
            }
            else
            {
                if (!updateStatus)
                {
                    onemsg = new TI_MSG_Message
                    {
                        usr_id = oneMessage.UsrId,
                        msg_d_creation = DateTime.Now,
                        msg_fk_id = oneMessage.FkId,
                        msg_fk_name = oneMessage.FkName,
                        msg_is_memo = oneMessage.IsMemo,
                        msg_is_td = oneMessage.IsToDo,
                        msg_content = GenerateXmlField(oneMessage.AllMessages)
                    };
                    _db.TI_MSG_Message.AddObject(onemsg);
                    _db.SaveChanges();
                    result = new Message
                    {
                        Id = onemsg.msg_id,
                        UsrId = onemsg.usr_id,
                        DCreation = onemsg.msg_d_creation,
                        FkId = onemsg.msg_fk_id,
                        FkName = onemsg.msg_fk_name,
                        IsMemo = onemsg.msg_is_memo,
                        IsToDo = onemsg.msg_is_td,
                        AllMessages = GetMessageItems(onemsg.msg_id, onemsg.msg_content)
                    };
                }
            }
            return result;
        }
        
        /// <summary>
        /// 
        /// </summary>
        /// <param name="usrId"></param>
        /// <param name="type">1 memo, 2 todolist </param>
        /// <returns></returns>
        public Message GetMessage(int usrId, int type)
        {
            var msg = _db.TI_MSG_Message.FirstOrDefault(m => m.usr_id == usrId && ((type == 1 && m.msg_is_memo) || (type == 2 && m.msg_is_td)));
            if (msg != null)
            {
                var onemsg = new Message
                {
                    Id = msg.msg_id,
                    UsrId = msg.usr_id,
                    DCreation = msg.msg_d_creation,
                    FkId = msg.msg_fk_id,
                    FkName = msg.msg_fk_name,
                    IsMemo = msg.msg_is_memo,
                    IsToDo = msg.msg_is_td,
                    AllMessages = GetMessageItems(msg.msg_id, msg.msg_content)
                };
                return onemsg;
            }
            else
            {
                return null;
            }
        }

        public Message DeleteMessage(Message oneMessage)
        {
            var result = new Message();
            var onemsg = _db.TI_MSG_Message.FirstOrDefault(m => m.msg_id == oneMessage.Id && m.usr_id == oneMessage.UsrId);
            if (onemsg != null)
            {
                var oldmsgItems = GetMessageItems(onemsg.msg_id, onemsg.msg_content);
                oldmsgItems = oneMessage.AllMessages.Aggregate(oldmsgItems, DeleteMsgItem);
                var mgsXml = GenerateXmlField(oldmsgItems);
                onemsg.msg_content = mgsXml;
                _db.TI_MSG_Message.ApplyCurrentValues(onemsg);
                _db.SaveChanges();
                result = new Message
                {
                    Id = onemsg.msg_id,
                    UsrId = onemsg.usr_id,
                    DCreation = onemsg.msg_d_creation,
                    FkId = onemsg.msg_fk_id,
                    FkName = onemsg.msg_fk_name,
                    IsMemo = onemsg.msg_is_memo,
                    IsToDo = onemsg.msg_is_td,
                    AllMessages = GetMessageItems(onemsg.msg_id, onemsg.msg_content)
                };
            }
            return result;
        }


        #region Private

        private List<MessageItem> GetMessageItems(int msgId, string xmlContent)
        {
            var msgItems = new List<MessageItem>();
            if (!string.IsNullOrEmpty(xmlContent))
            {
                var doc = new XmlDocument();
                doc.LoadXml(xmlContent);
                var nodeList = doc.SelectNodes("Msg/Item");
                if (nodeList != null)
                {
                    foreach (XmlNode node in nodeList)
                    {
                        var oneProp = new MessageItem();
                        if (node.Attributes != null)
                        {
                            oneProp.DCreation = GetDateTimeOrNow(GetXmlNodeValue(node, "Dc")).Value;
                            oneProp.DUpdate = GetDateTimeOrNow(GetXmlNodeValue(node, "Du")).Value;
                            oneProp.Id = node.Attributes["Id"] != null ? node.Attributes["Id"].Value : Guid.NewGuid().ToString();
                            oneProp.Content = GetXmlNodeValue(node, "Msg");
                            oneProp.IsRead = GetBool(GetXmlNodeValue(node, "IsRead"));
                            oneProp.IsTreated = GetBool(GetXmlNodeValue(node, "IsTreated"));
                            oneProp.MsgId = msgId;
                        }
                        msgItems.Add(oneProp);
                    }
                }
            }
            return msgItems;
        }

        private string GenerateXmlField(List<MessageItem> allMsg)
        {
            using (var stringWriter = new StringWriter())
            {
                using (var xmlTextWriter = XmlWriter.Create(stringWriter))
                {
                    //创建类型声明节点
                    XmlDocument xmlDoc = new XmlDocument();
                    XmlNode node = xmlDoc.CreateXmlDeclaration("1.0", "utf-16", "");
                    xmlDoc.AppendChild(node);
                    //创建根节点
                    XmlNode root = xmlDoc.CreateElement("Msg");
                    if (allMsg != null)
                    {
                        foreach (var msg in allMsg)
                        {
                            XmlElement propName = xmlDoc.CreateElement("Item");
                            propName.SetAttribute("Id", CheckAndParseGuid(msg.Id).ToString());
                            propName.SetAttribute("Dc", msg.DCreation.ToString(culture));
                            propName.SetAttribute("Du", msg.DUpdate.ToString(culture));
                            propName.SetAttribute("Msg", msg.Content);
                            propName.SetAttribute("IsRead", msg.IsRead.ToString());
                            propName.SetAttribute("IsTreated", msg.IsTreated.ToString());
                            root.AppendChild(propName);
                        }
                    }
                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }
        }

        public List<MessageItem> CreateUpdateMsgItem(List<MessageItem> msgList, MessageItem oneItem)
        {
            var item = msgList.FirstOrDefault(m => m.Id == oneItem.Id);
            if (item != null)
            {
                item.IsRead = oneItem.IsRead;
                item.IsTreated = oneItem.IsTreated;
                item.DUpdate = DateTime.Now;
                item.Content = oneItem.Content;
                item.DCreation = DateTime.Now;
            }
            else
            {
                msgList.Add(oneItem);
            }
            return msgList;
        }
        
        public List<MessageItem> CreateUpdateMsgItem(List<MessageItem> msgList, MessageItem oneItem, bool updateStatus)
        {
            var item = msgList.FirstOrDefault(m => m.Id == oneItem.Id);
            if (item != null)
            {
                item.IsRead = oneItem.IsRead;
                item.IsTreated = oneItem.IsTreated;
                item.DUpdate = DateTime.Now;
                if (!updateStatus)
                {
                    item.Content = oneItem.Content;
                }
            }
            else
            {
                msgList.Add(oneItem);
            }
            return msgList;
        }

        public List<MessageItem> DeleteMsgItem(List<MessageItem> msgList, MessageItem oneItem)
        {
            var item = msgList.FirstOrDefault(m => m.Id == oneItem.Id);
            if (item != null)
            {
                msgList.Remove(item);
            }
            return msgList;
        }

        private static CultureInfo culture = new CultureInfo("fr-FR", true);
        private static DateTime? GetDateTimeOrNow(string dateTime, bool isNullable = false)
        {
            try
            {
                return DateTime.Parse(dateTime, culture);
            }
            catch (Exception)
            {
                return isNullable ? (DateTime?)null : DateTime.Now;
            }
        }

        private static bool GetBool(string value)
        {
            try
            {
                bool blvalue;
                bool.TryParse(value, out blvalue);
                return blvalue;
            }
            catch (Exception)
            {
                return false;
            }
        }

        private string GetXmlNodeValue(XmlNode node, string name)
        {
            return (node.Attributes != null && node.Attributes[name] != null) ? node.Attributes[name].Value : string.Empty;
        }

        #endregion Private
    }
}
