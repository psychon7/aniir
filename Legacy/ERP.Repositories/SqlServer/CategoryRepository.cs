using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Security;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class CategoryRepository : BaseSqlServerRepository
    {
        CommonRepository CommonRepository = new CommonRepository();
        public int CreateUpdateCategory(Category oneCategory)
        {
            int catId = 0;
            bool create = false;
            if (oneCategory.CatId != 0)
            {
                var cat = _db.TM_CAT_Category.FirstOrDefault(m => m.cat_id == oneCategory.CatId && m.soc_id == oneCategory.SocId);
                if (cat != null)
                {
                    cat = CategoryTranslator.EntityToRepository(oneCategory, cat);
                    _db.TM_CAT_Category.ApplyCurrentValues(cat);
                    _db.SaveChanges();
                    catId = cat.cat_id;
                }
                else
                {
                    create = true;
                }
            }
            else
            {
                var checkCat = _db.TM_CAT_Category.FirstOrDefault(m => m.cat_name == oneCategory.CatName && m.soc_id == oneCategory.SocId);
                if (checkCat != null)
                {
                    checkCat = CategoryTranslator.EntityToRepository(oneCategory, checkCat);
                    _db.TM_CAT_Category.ApplyCurrentValues(checkCat);
                    _db.SaveChanges();
                    catId = checkCat.cat_id;
                }
                else
                {
                    create = true;
                }
            }
            if (create)
            {
                var newCategory = new TM_CAT_Category();
                newCategory = CategoryTranslator.EntityToRepository(oneCategory, newCategory, true);
                _db.TM_CAT_Category.AddObject(newCategory);
                _db.SaveChanges();
                catId = newCategory.cat_id;
            }
            return catId;
        }

        public Category LoadCategoryById(int catId, int socId, bool withSubCat = false)
        {
            var aCategory = _db.TM_CAT_Category.Where(m => m.soc_id == socId && (m.cat_id == catId || m.cat_parent_cat_id == catId)).Select(CategoryTranslator.RepositoryToEntity()).ToList();
            var oneCat = aCategory.FirstOrDefault(m => m.CatId == catId);
            if (oneCat != null && withSubCat)
            {
                oneCat.SubCategories = GetCategoriesWithSubCategories(oneCat.CatId, aCategory);
                oneCat.FId = StringCipher.EncoderSimple(oneCat.CatId.ToString(), "catId");
            }
            return oneCat;
        }

        public List<Category> SearchCategory(Category searchCategory)
        {
            var cats = _db.TM_CAT_Category.Where(m => m.soc_id == searchCategory.SocId
                && (string.IsNullOrEmpty(searchCategory.CatName.Trim()) || m.cat_name.StartsWith(searchCategory.CatName.Trim()))
               || m.cat_sub_name_1.StartsWith(searchCategory.CatName.Trim())
               || m.cat_sub_name_2.StartsWith(searchCategory.CatName.Trim())
                ).Select(CategoryTranslator.RepositoryToEntity()).OrderBy(m => m.CatOrder).ThenBy(m => m.CatName).ToList();
            //cats = SortCategories(cats);
            cats.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CatId.ToString(), "catId");
                m.SubCategories = GetCategoriesWithSubCategories(m.CatId, cats);
            });
            return cats;
        }

        public List<Category> GetAllCategory(int socId)
        {
            var cats = _db.TM_CAT_Category.Where(m => m.soc_id == socId).Select(CategoryTranslator.RepositoryToEntity()).ToList();
            cats.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.CatId.ToString(), "catId"); });
            cats = SortCategories(cats);
            cats = SortCategoriesToList(cats, 0);
            return cats;
        }

        public List<Category> GetTopCategories(int socId)
        {
            var cats = _db.TM_CAT_Category.Where(m => m.soc_id == socId && (!m.cat_parent_cat_id.HasValue || m.cat_parent_cat_id == m.cat_id)).Select(CategoryTranslator.RepositoryToEntity()).OrderBy(m => m.CatName).ToList();
            return cats;
        }

        private List<Category> SortCategories(List<Category> categories)
        {
            var level1 = categories.Where(m => m.CatParentCatId == null || m.CatParentCatId == m.CatId).OrderBy(m => m.CatOrder).ThenBy(m => m.CatName).ToList();
            level1.ForEach(m =>
            {
                m.SubCategories = GetCategoriesWithSubCategories(m.CatId, categories);
            });
            return level1;
        }

        private List<Category> GetCategoriesWithSubCategories(int catId, List<Category> categories)
        {
            var cats = categories.Where(m => m.CatParentCatId == catId && m.CatParentCatId != m.CatId).OrderBy(m => m.CatOrder).ThenBy(m => m.CatName).ToList();
            if (cats.Any())
            {
                cats.ForEach(m =>
                {
                    m.FId = StringCipher.EncoderSimple(m.CatId.ToString(), "catId");
                    m.SubCategories = GetCategoriesWithSubCategories(m.CatId, categories);
                });
            }
            return cats;
        }

        private List<Category> SortCategoriesToList(IEnumerable<Category> categoriesSorted, int level)
        {
            var listCats = new List<Category>();
            foreach (var category in categoriesSorted)
            {
                string prefix = string.Empty;
                for (int i = 0; i < level; i++)
                {
                    prefix += "┝ ";
                }
                category.CatName = prefix + category.CatName;
                category.CatLevel = level;
                listCats.Add(category);
                if (category.SubCategories != null && category.SubCategories.Any())
                {
                    var newLevel = level + 1;
                    var sorted = SortCategoriesToList(category.SubCategories, newLevel);
                    listCats.AddRange(sorted);
                }
            }
            return listCats;
        }

        public void UpdateCatFile(int socId, int catId, string filePath)
        {
            var item = _db.TM_CAT_Category.FirstOrDefault(m => m.soc_id == socId && m.cat_id == catId);
            if (item != null)
            {
                if (!string.IsNullOrEmpty(item.cat_image_path))
                {
                    CommonRepository.DeleteFile(item.cat_image_path);
                }
                item.cat_image_path = filePath;
                _db.TM_CAT_Category.ApplyCurrentValues(item);
                _db.SaveChanges();
            }
        }

        public bool DeleteCategory(int catId, int socId)
        {
            bool deleted = false;
            var cat = _db.TM_CAT_Category.FirstOrDefault(m => m.soc_id == socId && m.cat_id == catId);
            if (cat != null)
            {
                var pca = _db.TR_PCA_Product_Category.Where(m => m.cat_id == catId).ToList();
                foreach (var onepca in pca)
                {
                    _db.TR_PCA_Product_Category.DeleteObject(onepca);
                    _db.SaveChanges();
                }
                _db.TM_CAT_Category.DeleteObject(cat);
                _db.SaveChanges();
            }
            return deleted;
        }

        public List<Category> GetSubCategories(int socId, string catname = null, int catId = 0, int take = 0)
        {
            var result = new List<Category>();
            var onecat = _db.TM_CAT_Category.FirstOrDefault(m =>
                (!string.IsNullOrEmpty(catname) && m.cat_name == catname)
                ||
                (catId != 0 && m.cat_id == catId));
            if (onecat != null)
            {
                var cats = _db.TM_CAT_Category.Where(m => m.cat_parent_cat_id == onecat.cat_id && (m.cat_parent_cat_id != m.cat_id)).Select(CategoryTranslator.RepositoryToEntity());
                result = take != 0 ? cats.Take(take).ToList() : cats.ToList();
            }
            return result;
        }

        #region Product In Category

        public int CreateUpdatePca(int socId, int pcaId, int prdId, int catId, string pcaDes)
        {
            var pca_id = 0;
            var catPrd = (from cat in _db.TM_CAT_Category
                          from prd in _db.TM_PRD_Product
                          where cat.soc_id == socId
                                && prd.soc_id == socId
                                && cat.cat_id == catId
                                && prd.prd_id == prdId
                          select new { cat, prd }).FirstOrDefault();
            if (catPrd != null)
            {
                var pca = _db.TR_PCA_Product_Category.FirstOrDefault(m => m.pca_id == pcaId);
                var pcaCheck = _db.TR_PCA_Product_Category.FirstOrDefault(m => m.prd_id == prdId && m.cat_id == catId);
                if (pca != null || pcaCheck != null)
                {
                    if (pcaCheck != null && pca != null)
                    {
                        if (pcaCheck.pca_id != pca.pca_id)
                        {
                            _db.TR_PCA_Product_Category.DeleteObject(pca);
                            _db.SaveChanges();
                        }
                        pcaCheck.pca_description = pcaDes;
                        _db.TR_PCA_Product_Category.ApplyCurrentValues(pcaCheck);
                        _db.SaveChanges();
                        pca_id = pcaCheck.pca_id;
                    }
                    else
                    {
                        if (pca != null)
                        {
                            pca.cat_id = catPrd.cat.cat_id;
                            pca.prd_id = catPrd.prd.prd_id;
                            pca.pca_description = pcaDes;
                            _db.TR_PCA_Product_Category.ApplyCurrentValues(pca);
                            _db.SaveChanges();
                            pca_id = pca.pca_id;
                        }
                        else if (pcaCheck != null)
                        {
                            pcaCheck.cat_id = catPrd.cat.cat_id;
                            pcaCheck.prd_id = catPrd.prd.prd_id;
                            pcaCheck.pca_description = pcaDes;
                            _db.TR_PCA_Product_Category.ApplyCurrentValues(pcaCheck);
                            _db.SaveChanges();
                            pca_id = pcaCheck.pca_id;
                        }
                    }
                }
                else
                {
                    pca = new TR_PCA_Product_Category
                    {
                        cat_id = catPrd.cat.cat_id,
                        prd_id = catPrd.prd.prd_id,
                        pca_description = pcaDes
                    };
                    _db.TR_PCA_Product_Category.AddObject(pca);
                    _db.SaveChanges();
                    pca_id = pca.pca_id;
                }
            }

            return pca_id;
        }

        public void DeletePca(int pcaId, int catId = 0, int prdId = 0)
        {
            if (catId != 0)
            {
                // delete all pca in this category
                var pcas = _db.TR_PCA_Product_Category.Where(m => m.cat_id == catId).ToList();
                foreach (var onepca in pcas)
                {
                    _db.TR_PCA_Product_Category.DeleteObject(onepca);
                    _db.SaveChanges();
                }
            }
            if (prdId != 0)
            {
                // delete all pca with this product
                var pcas = _db.TR_PCA_Product_Category.Where(m => m.prd_id == prdId).ToList();
                foreach (var onepca in pcas)
                {
                    _db.TR_PCA_Product_Category.DeleteObject(onepca);
                    _db.SaveChanges();
                }
            }
            var pca = _db.TR_PCA_Product_Category.FirstOrDefault(m => m.pca_id == pcaId);
            if (pca != null)
            {
                _db.TR_PCA_Product_Category.DeleteObject(pca);
                _db.SaveChanges();
            }
        }

        public List<ProductInCategory> GetPrdCats(int socId, int pcaId = 0, int catId = 0, int prdId = 0, bool forsite = false)
        {
            ProductRepository ProductRepository = new ProductRepository();
            var pcas = _db.TR_PCA_Product_Category.Where(m =>
                (pcaId == 0 || m.pca_id == pcaId)
                && (catId == 0 || m.cat_id == catId)
                && (prdId == 0 || m.prd_id == prdId)
                && m.TM_CAT_Category.soc_id == socId && m.TM_PRD_Product.soc_id == socId).Select(CategoryTranslator.PcaRepositoryToEntity(forsite)).ToList();
            pcas.ForEach(m =>
            {
                m.Product.FId = StringCipher.EncoderSimple(m.Product.PrdId.ToString(), "prdId");
                m.Product.PrdGeneralInfoList =
                    ProductRepository.GetGeneralPropertyValuesFormXml(m.Product.PtyId, socId,
                        m.Product.PrdSepcifications,
                        true).Where(l => l.PropName == "Puissance").ToList();
            });
            return pcas;
        }

        public bool CatHasSubCats(int socId, int catId)
        {
            return _db.TM_CAT_Category.Any(m => m.soc_id == socId && m.cat_parent_cat_id == catId);
        }

        #endregion Product In Category

        #region For Site

        public List<Category> GetAllCategoryWithSubCat(int socId)
        {
            var AllCats = _db.TM_CAT_Category.Where(m => m.soc_id == socId
                && m.cat_display_in_menu
                && m.cat_is_actived).Select(CategoryTranslator.RepositoryToEntity()).ToList();
            var catLevel1 = AllCats.Where(m => m.CatId == m.CatParentCatId || !m.CatParentCatId.HasValue).ToList();
            catLevel1.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CatId.ToString(), "catId");
                m.SubCategories = GetCategoriesWithSubCategories(m.CatId, AllCats);
            });
            return catLevel1;
        }

        public List<int> GetAllCatIdWithSubCat(int socId)
        {
            var allcats = GetAllCategoryWithSubCat(socId);
            var allIds = new List<int>();
            foreach (var category in allcats)
            {
                allIds = getCatIds(category);
            }
            allIds = allIds.Distinct().ToList();
            return allIds;
        }

        private List<int> getCatIds(Category onecate)
        {
            var result = new List<int>();
            result.Add(onecate.CatId);
            if (onecate.SubCategories.Any())
            {
                result.AddRange(onecate.SubCategories.Select(m=>m.CatId));
                foreach (var subCategory in onecate.SubCategories)
                {
                    getCatIds(subCategory);
                }
            }
            return result;
        }

        public List<Category> GetAllCategoryWithSubCatWithOutCatSpe(int socId, string specialCat)
        {
            var AllCats = _db.TM_CAT_Category.Where(m => m.soc_id == socId
                && m.cat_display_in_menu
                && m.cat_is_actived
                && m.cat_name != specialCat).Select(CategoryTranslator.RepositoryToEntity()).ToList();
            var catLevel1 = AllCats.Where(m => m.CatId == m.CatParentCatId || !m.CatParentCatId.HasValue).ToList();
            catLevel1.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CatId.ToString(), "catId");
                m.SubCategories = GetCategoriesWithSubCategories(m.CatId, AllCats);
            });
            return catLevel1;
        }

        public List<Category> GetAllCategoryWithSubCat(int socId, int catId)
        {
            var AllCats = _db.TM_CAT_Category.Where(m => m.soc_id == socId
                && m.cat_display_in_menu
                && m.cat_is_actived
                && m.cat_parent_cat_id == catId).Select(CategoryTranslator.RepositoryToEntity()).ToList();
            var catLevel1 = AllCats.ToList();
            catLevel1.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CatId.ToString(), "catId");
                m.SubCategories = GetCategoriesWithSubCategories(m.CatId, AllCats);
            });
            return catLevel1;
        }

        public List<Category> GetAllCatForExposition(int socId)
        {
            var AllCats = _db.TM_CAT_Category.Where(m => m.soc_id == socId
                && m.cat_display_in_exhibition
                && m.cat_is_actived
                ).Select(CategoryTranslator.RepositoryToEntity()).ToList();
            AllCats.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CatId.ToString(), "catId");
            });
            return AllCats;
        }

        public List<Category> GetAllCatForExpositionWithoutCatSpe(int socId, string specialCat)
        {
            var AllCats = _db.TM_CAT_Category.Where(m => m.soc_id == socId
                && m.cat_display_in_exhibition
                && m.cat_is_actived
                && m.cat_name != specialCat
                ).Select(CategoryTranslator.RepositoryToEntity()).ToList();
            AllCats.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CatId.ToString(), "catId");
            });
            return AllCats;
        }
        #endregion For Site
    }
}
