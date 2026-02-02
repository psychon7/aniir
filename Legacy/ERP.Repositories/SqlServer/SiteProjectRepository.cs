using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Linq.Expressions;
using System.Security.Cryptography.Xml;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer
{
    public class SiteProjectRepository : BaseSqlServerRepository
    {
        #region Translator

        private static Expression<Func<TS_PRJ_Project, SiteProject>> RepositoryToEntity()
        {
            return o => new SiteProject
            {
                PrjClient = o.prj_client,
                PrjDCreate = o.prj_d_create,
                PrjDate = o.prj_date,
                PrjDescription = o.prj_description,
                PrjDesigner = o.prj_designer,
                PrjId = o.prj_id,
                PrjLocation = o.prj_location,
                PrjName = o.prj_name,
                PrjImg = o.TS_PIG_Project_Image.Any(l => l.pig_order == 1) ? o.TS_PIG_Project_Image.FirstOrDefault(l => l.pig_order == 1).pig_path : string.Empty,
                PrjActived = o.prj_actived,
                PrjRecommended = o.prj_recommended,
                PrjImages = o.TS_PIG_Project_Image.Select(m => new SiteProjectImage
                {
                    PigId = m.pig_id,
                    PigOrder = m.pig_order,
                    PigPath = m.pig_path,
                    PrjId = m.prj_id
                }),
                PrjProducts = o.TS_PPD_Project_Product.Select(m => new SiteProjectProduct
                {
                    PrdId = m.prd_id
                }),
                PrjTags = o.TS_PTG_Project_Tag.Select(m => new KeyValue
                {
                    Key = m.ptg_id,
                    Value = m.TS_TAG_Tags.tag_tag
                })
            };
        }

        private static TS_PRJ_Project EntityToRepository(SiteProject _from, TS_PRJ_Project _to, bool create = false)
        {
            if (create || _to == null)
            {
                _to = new TS_PRJ_Project();
                _to.prj_date = _from.PrjDate;
                _to.prj_d_create = DateTime.Now;
            }
            _to.prj_client = _from.PrjClient;
            _to.prj_date = _from.PrjDate;
            _to.prj_description = _from.PrjDescription;
            _to.prj_designer = _from.PrjDesigner;
            _to.prj_location = _from.PrjLocation;
            _to.prj_name = _from.PrjName;
            _to.prj_actived = _from.PrjActived;
            _to.prj_recommended = _from.PrjRecommended;
            return _to;
        }

        #endregion Translator

        CommonRepository CommonRepository = new CommonRepository();
        #region Site Project

        public List<SiteProject> GetAllSiteProjects(bool? active, int prjId = 0)
        {
            var prjs = _db.TS_PRJ_Project.Where(m => (!active.HasValue || m.prj_actived == active) && (prjId == 0 || m.prj_id == prjId)).Select(RepositoryToEntity()).ToList();
            return prjs;
        }

        public SiteProject GetSiteProjectByPrjId(bool? active, int prjId)
        {
            var prj = GetAllSiteProjects(active, prjId).FirstOrDefault();
            if (prj != null)
            {
                var prdIds = prj.PrjProducts.Select(m => m.PrdId).ToList();
                var prds = (from prd in _db.TM_PRD_Product
                            join prdid in prdIds on prd.prd_id equals prdid
                            select prd).ToList();
                foreach (var siteprd in prj.PrjProducts)
                {
                    var oneprd = prds.FirstOrDefault(m => m.prd_id == siteprd.PrdId);
                    if (oneprd != null)
                    {
                        siteprd.PrdName = oneprd.prd_name;
                        siteprd.PrdRef = oneprd.prd_ref;
                        siteprd.PrdSubName = oneprd.prd_sub_name;
                        siteprd.PrdImg = oneprd.TI_PIM_Product_Image.Any() &&
                                         oneprd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10) != null
                            ? oneprd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10).pim_path
                            : string.Empty;
                    }
                }
            }
            return prj;
        }

        public int CreateUpdateSiteProject(SiteProject onePrj)
        {
            var prj = _db.TS_PRJ_Project.FirstOrDefault(m => m.prj_id == onePrj.PrjId);

            onePrj.PrjDate = onePrj.PrjDate < new DateTime(1900) ? null : onePrj.PrjDate;
            int prjId = 0;
            if (prj != null)
            {
                prj = EntityToRepository(onePrj, prj);
                _db.TS_PRJ_Project.ApplyCurrentValues(prj);
                _db.SaveChanges();
                prjId = prj.prj_id;
            }
            else
            {
                prj = EntityToRepository(onePrj, null, true);
                _db.TS_PRJ_Project.AddObject(prj);
                _db.SaveChanges();
                prjId = prj.prj_id;
            }
            // for tags 
            if (!string.IsNullOrEmpty(onePrj.PrjTag))
            {
                var tags = onePrj.PrjTag.Split(';').ToList().Select(m => m.Trim()).Where(m => !string.IsNullOrEmpty(m)).Distinct().ToList();
                var tag_tags = (from tg in _db.TS_TAG_Tags
                                join tag in tags on tg.tag_tag equals tag
                                select tg).ToList();
                var tagsExisted = tag_tags.Select(m => m.tag_tag).ToList();
                var tagsNoExisted = tags.Except(tagsExisted).ToList();
                var tagIds = new List<int>();
                foreach (var onetag in tagsNoExisted)
                {
                    var newtag = new TS_TAG_Tags { tag_tag = onetag };
                    _db.TS_TAG_Tags.AddObject(newtag);
                    _db.SaveChanges();
                    tagIds.Add(newtag.tag_id);
                }
                tagIds.AddRange(tag_tags.Select(m => m.tag_id));
                var allPrjTags = _db.TS_PTG_Project_Tag.Where(m => m.prj_id == prjId).ToList();
                var prjtagExisted = allPrjTags;
                var prjtagNew = tagIds;
                var tagIdsUnion = (from old in prjtagExisted join newone in prjtagNew on old.tag_id equals newone select newone).ToList();
                var tag2Delete = allPrjTags.Except(allPrjTags.Where(m => tagIdsUnion.Contains(m.tag_id)).ToList());
                var tag2Create = prjtagNew.Except(prjtagNew.Where(m => tagIdsUnion.Contains(m))).ToList();
                foreach (var ptg in tag2Delete)
                {
                    _db.TS_PTG_Project_Tag.DeleteObject(ptg);
                    _db.SaveChanges();
                }
                foreach (var tagId in tag2Create)
                {
                    var ptg = new TS_PTG_Project_Tag
                    {
                        prj_id = prjId,
                        tag_id = tagId
                    };
                    _db.TS_PTG_Project_Tag.AddObject(ptg);
                    _db.SaveChanges();
                }
            }
            else
            {
                var allPrjTags = _db.TS_PTG_Project_Tag.Where(m => m.prj_id == prjId).ToList();
                foreach (var tsPtgProjectTag in allPrjTags)
                {
                    _db.TS_PTG_Project_Tag.DeleteObject(tsPtgProjectTag);
                    _db.SaveChanges();
                }
            }
            return prjId;
        }

        public void DeleteSiteProject(int prjId)
        {
            var prj = _db.TS_PRJ_Project.FirstOrDefault(m => m.prj_id == prjId);
            if (prj != null)
            {
                var imgs = _db.TS_PIG_Project_Image.Where(m => m.prj_id == prjId).ToList();
                foreach (var img in imgs)
                {
                    _db.TS_PIG_Project_Image.DeleteObject(img);
                }
                _db.SaveChanges();
                var ppds = _db.TS_PPD_Project_Product.Where(m => m.prj_id == prjId).ToList();
                foreach (var ppd in ppds)
                {
                    _db.TS_PPD_Project_Product.DeleteObject(ppd);
                }
                _db.SaveChanges();
                _db.TS_PRJ_Project.DeleteObject(prj);
                _db.SaveChanges();
            }
        }

        public List<SiteProject> GetSiteProjectsByPrdId(bool? active, int prdId)
        {
            var prjs = (from prj in _db.TS_PRJ_Project
                        join ppd in _db.TS_PPD_Project_Product on prj.prj_id equals ppd.prj_id
                        where (!active.HasValue || prj.prj_actived) && ppd.prd_id == prdId
                        select prj).Select(RepositoryToEntity()).ToList();
            return prjs;
        }

        public List<SiteProject> GetProjectsWithTagId(int tagId)
        {
            var sitePrj = (from prj in _db.TS_PRJ_Project
                           join ptg in _db.TS_PTG_Project_Tag on prj.prj_id equals ptg.prj_id
                           where (tagId == 0 || ptg.tag_id == tagId) && prj.prj_actived
                           select prj).Select(RepositoryToEntity()).ToList();
            return sitePrj;
        }

        #endregion Site Project

        #region Project Image

        public IQueryable<SiteProjectImage> GetAllSiteProjectImages(int prjId)
        {
            var imgs = _db.TS_PIG_Project_Image.Where(m => m.prj_id == prjId).Select(m => new SiteProjectImage
            {
                PigId = m.pig_id,
                PrjId = m.prj_id,
                PigOrder = m.pig_order,
                PigPath = m.pig_path
            });
            return imgs;
        }

        public SiteProjectImage GetOneImage(int prjId, int pigId)
        {
            var oneImg = GetAllSiteProjectImages(prjId).FirstOrDefault(m => m.PigId == pigId);
            return oneImg;
        }

        public int CreateUpdateDeleteImage(int prjId, int pigId, int order, string path, bool delete = false)
        {
            int pig_id = 0;
            var img = _db.TS_PIG_Project_Image.FirstOrDefault(m => m.prj_id == prjId && m.pig_id == pigId);
            if (img != null)
            {
                if (delete)
                {
                    var oldPath = img.pig_path;
                    CommonRepository.DeleteFile(oldPath);
                    _db.TS_PIG_Project_Image.DeleteObject(img);
                    _db.SaveChanges();
                }
                else
                {
                    img.pig_order = order;
                    var oldPath = img.pig_path;
                    CommonRepository.DeleteFile(oldPath);
                    if (!string.IsNullOrEmpty(path))
                    {
                        img.pig_path = path;
                    }
                    _db.TS_PIG_Project_Image.ApplyCurrentValues(img);
                    _db.SaveChanges();
                    pig_id = img.pig_id;
                }
            }
            else
            {
                if (!string.IsNullOrEmpty(path))
                {
                    img = new TS_PIG_Project_Image
                    {
                        prj_id = prjId,
                        pig_order = order,
                        pig_path = path
                    };
                    _db.TS_PIG_Project_Image.AddObject(img);
                    _db.SaveChanges();
                    pig_id = img.pig_id;
                }
            }
            return pig_id;
        }

        #endregion Project Image

        #region Project Product

        public IQueryable<SiteProjectProduct> GetAllSiteProjectProducts(int prjId)
        {
            var ppds = (from ppd in _db.TS_PPD_Project_Product
                        join prd in _db.TM_PRD_Product on ppd.prd_id equals prd.prd_id
                        where ppd.prj_id == prjId
                        select new SiteProjectProduct
                        {
                            PrjId = ppd.prj_id,
                            PpdId = ppd.ppd_id,
                            PrdId = ppd.prd_id,
                            PrdName = prd.prd_name,
                            PrdSubName = prd.prd_sub_name,
                            PrdRef = prd.prd_ref,
                            PrdImg = prd.TI_PIM_Product_Image.Any() && prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10) != null
                                ? prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10).pim_path
                            : string.Empty,
                        }
                );
            return ppds;
        }

        public int CreateProjectProduct(int prjId, int prdId)
        {
            var ppd = _db.TS_PPD_Project_Product.FirstOrDefault(m => m.prj_id == prjId && m.prd_id == prdId);
            if (ppd == null)
            {
                ppd = new TS_PPD_Project_Product
                {
                    prj_id = prjId,
                    prd_id = prdId
                };
                _db.TS_PPD_Project_Product.AddObject(ppd);
                _db.SaveChanges();
            }
            return ppd.ppd_id;
        }

        public void DeleteProjectProduct(int prjId, int prdId)
        {
            var ppd = _db.TS_PPD_Project_Product.FirstOrDefault(m => m.prj_id == prjId && m.prd_id == prdId);
            if (ppd != null)
            {
                _db.TS_PPD_Project_Product.DeleteObject(ppd);
                _db.SaveChanges();
            }
        }

        public List<Product> GetRelatedProducts(int prdId)
        {
            var result = new List<Product>();
            var oneprd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId);
            if (oneprd != null)
            {
                var cats = oneprd.TR_PCA_Product_Category.Select(m => m.cat_id).ToList();
                result = (from prd in _db.TM_PRD_Product
                          join pca in _db.TR_PCA_Product_Category on prd.prd_id equals pca.prd_id
                          where prd.prd_sub_name == oneprd.prd_sub_name && prd.prd_id != oneprd.prd_id
                          && cats.Contains(pca.cat_id)
                          select prd)
                        .Select(prd => new Product
                        {
                            SocId = prd.soc_id,
                            PtyId = prd.pty_id,
                            PrdDescription = prd.prd_description,
                            PrdId = prd.prd_id,
                            PrdName = prd.prd_name,
                            PrdSubName = prd.prd_sub_name,
                            PrdPrice = prd.prd_price,
                            PrdRef = prd.prd_ref,
                            PrdPurchasePrice = prd.prd_purchase_price,
                            PrdFileName = prd.prd_file_name,
                            PrdCode = prd.prd_code,
                            PrdOutsideDiameter = prd.prd_outside_diameter,
                            PrdLength = prd.prd_length,
                            PrdWidth = prd.prd_width,
                            PrdHeight = prd.prd_height,
                            PrdHoleSize = prd.prd_hole_size,
                            PrdDepth = prd.prd_depth,
                            PrdWeight = prd.prd_weight,
                            PrdUnitLength = prd.prd_unit_length,
                            PrdUnitWidth = prd.prd_unit_width,
                            PrdUnitHeight = prd.prd_unit_height,
                            PrdUnitWeight = prd.prd_unit_weight,
                            PrdQuantityEachCarton = prd.prd_quantity_each_carton,
                            PrdCartonLength = prd.prd_carton_length,
                            PrdCartonWidth = prd.prd_carton_width,
                            PrdCartonHeight = prd.prd_carton_height,
                            PrdCartonWeight = prd.prd_carton_weight,
                            PtyStandards = prd.TM_PTY_Product_Type.pty_standards,

                            PrdOutsideHeight = prd.prd_outside_height,
                            PrdOutsideLength = prd.prd_outside_length,
                            PrdOutsideWidth = prd.prd_outside_width,
                            PrdHoleLength = prd.prd_hole_lenght,
                            PrdHoleWidth = prd.prd_hole_width,
                            ProductType = prd.TM_PTY_Product_Type.pty_name,
                            PrdImg = prd.TI_PIM_Product_Image.Any() && prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10) != null
                   ? prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10).pim_path
                   : string.Empty,
                        }).ToList();
            }
            return result;
        }


        public List<Product> GetRelatedProductsForSite(int prdId, string category)
        {
            var result = new List<Product>();
            var oneprd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId);
            if (oneprd != null)
            {
                CategoryRepository CategoryRepository = new CategoryRepository();
                var cats = CategoryRepository.GetAllCatIdWithSubCat(1);
                //var cats = oneprd.TR_PCA_Product_Category.Select(m => m.cat_id).ToList();
                result = (from prd in _db.TM_PRD_Product
                          join pca in _db.TR_PCA_Product_Category on prd.prd_id equals pca.prd_id
                          where prd.prd_sub_name == oneprd.prd_sub_name && prd.prd_id != oneprd.prd_id
                          && cats.Contains(pca.cat_id)
                          select prd)
                        .Select(prd => new Product
                        {
                            SocId = prd.soc_id,
                            PtyId = prd.pty_id,
                            PrdDescription = prd.prd_description,
                            PrdId = prd.prd_id,
                            PrdName = prd.prd_name,
                            PrdSubName = prd.prd_sub_name,
                            PrdPrice = prd.prd_price,
                            PrdRef = prd.prd_ref,
                            PrdPurchasePrice = prd.prd_purchase_price,
                            PrdFileName = prd.prd_file_name,
                            PrdCode = prd.prd_code,
                            PrdOutsideDiameter = prd.prd_outside_diameter,
                            PrdLength = prd.prd_length,
                            PrdWidth = prd.prd_width,
                            PrdHeight = prd.prd_height,
                            PrdHoleSize = prd.prd_hole_size,
                            PrdDepth = prd.prd_depth,
                            PrdWeight = prd.prd_weight,
                            PrdUnitLength = prd.prd_unit_length,
                            PrdUnitWidth = prd.prd_unit_width,
                            PrdUnitHeight = prd.prd_unit_height,
                            PrdUnitWeight = prd.prd_unit_weight,
                            PrdQuantityEachCarton = prd.prd_quantity_each_carton,
                            PrdCartonLength = prd.prd_carton_length,
                            PrdCartonWidth = prd.prd_carton_width,
                            PrdCartonHeight = prd.prd_carton_height,
                            PrdCartonWeight = prd.prd_carton_weight,
                            PtyStandards = prd.TM_PTY_Product_Type.pty_standards,

                            PrdOutsideHeight = prd.prd_outside_height,
                            PrdOutsideLength = prd.prd_outside_length,
                            PrdOutsideWidth = prd.prd_outside_width,
                            PrdHoleLength = prd.prd_hole_lenght,
                            PrdHoleWidth = prd.prd_hole_width,
                            ProductType = prd.TM_PTY_Product_Type.pty_name,
                            PrdImg = prd.TI_PIM_Product_Image.Any() && prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10) != null
                   ? prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10).pim_path
                   : string.Empty,
                        }).ToList();
            }
            return result;
        }

        #endregion Project Product

        #region Tags

        public List<KeyValue> GetUsedTags(int tagId)
        {
            var tags = _db.TS_TAG_Tags.Where(m => m.TS_PTG_Project_Tag.Any() && (tagId == 0 || m.tag_id == tagId)).Select(m => new KeyValue
            {
                Key = m.tag_id,
                Value = m.tag_tag
            }).ToList();
            return tags;
        }

        #endregion Tags

        #region General Search

        private CategoryRepository CategoryRepository = new CategoryRepository();
        public List<KeyValue> GeneralSearch(string key, string catname = null)
        {
            var result = new List<KeyValue>();
            // product
            var cats = _db.TM_CAT_Category.Where(m => m.cat_name.StartsWith(catname)).ToList();
            var catIds = cats.Select(m => m.cat_id).ToList();
            int catcount = 1;
            while (catcount != 0)
            {
                var subcats = (from subcat in _db.TM_CAT_Category
                               join catid in catIds on subcat.cat_parent_cat_id equals catid
                               select subcat).ToList();
                var subcatIds = subcats.Select(m => m.cat_id);
                if (subcatIds.All(b => catIds.Any(a => a.Equals(b))))
                {
                    catcount = 0;
                }
                else
                {
                    catIds.AddRange(subcats.Select(m => m.cat_id));
                    catIds = catIds.Distinct().ToList();
                }
            }
            var prds = (from prd in _db.TM_PRD_Product
                        join pca in _db.TR_PCA_Product_Category on prd.prd_id equals pca.prd_id
                        join catid in catIds on pca.cat_id equals catid
                        where (prd.prd_name.StartsWith(key))
                        select prd).Select(m => new KeyValue
                {
                    Key = m.prd_id,
                    Value = m.prd_name,
                    Key2 = 1,
                    Value2 = m.TI_PIM_Product_Image.Any() && m.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10) != null
                    ? m.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10).pim_path
                    : string.Empty,
                    Value3 = m.prd_sub_name
                });
            result.AddRange(prds);
            // project
            var prjs = _db.TS_PRJ_Project.Where(m => m.prj_name.StartsWith(key) || m.prj_location.StartsWith(key)).Select(m => new KeyValue
            {
                Key = m.prj_id,
                Value = m.prj_name,
                Key2 = 2,
                Value2 = m.TS_PIG_Project_Image.Any(l => l.pig_order == 1) ? m.TS_PIG_Project_Image.FirstOrDefault(l => l.pig_order == 1).pig_path : string.Empty,
                Value3 = m.prj_location
            });
            result.AddRange(prjs);
            return result;
        }

        #endregion General Search


    }
}
