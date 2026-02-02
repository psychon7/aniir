using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Repositories.DataBase;
using ERP.Entities;
using System.IO;
using System.Runtime.Remoting.Messaging;

namespace ERP.Repositories.SqlServer
{
    public class AlbumRepository : BaseSqlServerRepository
    {
        CommonRepository CommonRepository = new CommonRepository();
        public int CreateUpdateAlbum(KeyValueSimple oneAlbum, int socId)
        {
            bool iscreate = false;
            int albId = 0;
            if (oneAlbum.Key != 0)
            {
                var alb = _db.TR_ALB_Album.FirstOrDefault(m => m.alb_id == oneAlbum.Key && m.soc_id == socId);
                if (alb != null)
                {
                    alb.alb_name = oneAlbum.Value;
                    alb.alb_description = oneAlbum.Value2;
                    _db.TR_ALB_Album.ApplyCurrentValues(alb);
                    _db.SaveChanges();
                    albId = alb.alb_id;
                }
                else
                {
                    iscreate = true;
                }
            }
            else
            {
                iscreate = true;
            }
            if (iscreate)
            {
                var oneAlb = new TR_ALB_Album
                {
                    alb_name = oneAlbum.Value,
                    alb_description = oneAlbum.Value2,
                    alb_d_creation = DateTime.Now,
                    soc_id = socId
                };

                _db.TR_ALB_Album.AddObject(oneAlb);
                _db.SaveChanges();
                albId = oneAlb.alb_id;
            }
            return albId;
        }

        public KeyValue GetOneAlbum(int albId, int socId)
        {
            var allAlbs = _db.TR_ALB_Album.Where(m => m.alb_id == albId && m.soc_id == socId).Select(m => new KeyValue
            {
                Key = m.alb_id,
                Value = m.alb_name,
                Value2 = m.alb_description,
                DValue = m.alb_d_creation
            }).OrderBy(m => m.DValue).ToList();
            allAlbs.ForEach(m => m.Key2 = _db.TR_PAL_Photo_Album.Count(l => l.alb_id == m.Key));
            return allAlbs.FirstOrDefault();
        }

        public List<KeyValue> GetAllAlbum(int socId)
        {
            var allAlbs = _db.TR_ALB_Album.Where(m => m.soc_id == socId).Select(m => new KeyValue
            {
                Key = m.alb_id,
                Value = m.alb_name,
                Value2 = m.alb_description,
                DValue = m.alb_d_creation
            }).OrderBy(m => m.DValue).ToList();
            allAlbs.ForEach(m => m.Key2 = _db.TR_PAL_Photo_Album.Count(l => l.alb_id == m.Key));
            return allAlbs;
        }

        public List<KeyValue> GetImagesInAlbum(int albId, int socId)
        {
            var images = (from alb in _db.TR_ALB_Album
                          join pal in _db.TR_PAL_Photo_Album on alb.alb_id equals pal.alb_id
                          where alb.soc_id == socId
                                && alb.alb_id == albId
                          select pal).Select(m => new KeyValue
                {
                    Key = m.alb_id,
                    Key2 = m.pal_id,
                    Value = m.pal_path,
                    Value2 = m.pal_description
                }).ToList();

            return images;
        }

        public string GetImagePathFromAlbum(int socId, string imgDes, string albname = null)
        {
            if (!string.IsNullOrEmpty(imgDes))
            {
                imgDes = imgDes.Replace(">", "大于");
                imgDes = imgDes.Replace("<", "小于");
            }
            var image = (from alb in _db.TR_ALB_Album
                         join pal in _db.TR_PAL_Photo_Album on alb.alb_id equals pal.alb_id
                         where alb.soc_id == socId
                               && pal.pal_description != null
                               && pal.pal_description.Contains(imgDes)
                               && (string.IsNullOrEmpty(albname) || alb.alb_name.Contains(albname))
                         select pal
                ).FirstOrDefault();
            return image != null ? image.pal_path : string.Empty;
        }

        public void DeletePhoto(int albId, int palId, int socId)
        {
            var onepal = (from pal in _db.TR_PAL_Photo_Album
                          join alb in _db.TR_ALB_Album
                              on pal.alb_id equals alb.alb_id
                          where alb.alb_id == albId && alb.soc_id == socId && pal.pal_id == palId
                          select pal).FirstOrDefault();
            if (onepal != null)
            {
                _deletePhoto(onepal);
            }
        }

        private bool _deletePhoto(TR_PAL_Photo_Album pal)
        {
            bool isDeleted = true;
            try
            {
                // TODO: 1. delete product image
                // if in use isDeleted  = false
                CommonRepository.DeleteFile(pal.pal_path);
                _db.TR_PAL_Photo_Album.DeleteObject(pal);
                _db.SaveChanges();
            }
            catch (Exception)
            {
            }
            return isDeleted;
        }

        public void DeleteAlbum(int albId, int socId)
        {
            var pals = (from alb in _db.TR_ALB_Album
                        join pal in _db.TR_PAL_Photo_Album
                            on alb.alb_id equals pal.alb_id
                        where alb.alb_id == albId && alb.soc_id == socId
                        select pal).ToList();
            bool isAllDeleted = pals.Aggregate(true, (current, pal) => current && _deletePhoto(pal));
            if (isAllDeleted)
            {
                var alb = _db.TR_ALB_Album.FirstOrDefault(m => m.alb_id == albId && m.soc_id == socId);
                if (alb != null)
                {
                    _db.TR_ALB_Album.DeleteObject(alb);
                    _db.SaveChanges();
                }
            }
        }

        public void AddUpdateImageToAlbum(int albId, int socId, string filePath, int palId, string description)
        {
            var onepal = (from alb in _db.TR_ALB_Album
                          join pal in _db.TR_PAL_Photo_Album on alb.alb_id equals pal.alb_id
                          where alb.soc_id == socId && pal.pal_id == palId
                          select pal).FirstOrDefault();
            //bool iscreate = false;
            if (onepal != null)
            {
                CommonRepository.DeleteFile(onepal.pal_path);
                onepal.pal_path = filePath;
                onepal.pal_description = description;
                onepal.pal_d_update = DateTime.Now;
                _db.TR_PAL_Photo_Album.ApplyCurrentValues(onepal);
            }
            else
            {
                onepal = new TR_PAL_Photo_Album
                {
                    alb_id = albId,
                    pal_d_creation = DateTime.Now,
                    pal_d_update = DateTime.Now,
                    pal_description = description,
                    pal_path = filePath
                };
                _db.TR_PAL_Photo_Album.AddObject(onepal);
            }
            _db.SaveChanges();
        }
    }
}

