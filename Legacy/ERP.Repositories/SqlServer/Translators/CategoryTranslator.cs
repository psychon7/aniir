using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class CategoryTranslator
    {
        public static Expression<Func<TM_CAT_Category, Category>> RepositoryToEntity()
        {
            return o => new Category
                        {
                            SocId = o.soc_id,
                            CatId = o.cat_id,
                            CatParentCatId = o.cat_parent_cat_id,
                            CatDescription = o.cat_description,
                            CatDisplayInExhibition = o.cat_display_in_exhibition,
                            CatDisplayInMenu = o.cat_display_in_menu,
                            CatImagePath = o.cat_image_path,
                            CatIsActived = o.cat_is_actived,
                            CatName = o.cat_name,
                            CatOrder = o.cat_order,
                            CatSubName1 = o.cat_sub_name_1,
                            CatSubName2 = o.cat_sub_name_2,
                            CatParentCatName = (o.cat_parent_cat_id == null || o.cat_id == o.cat_parent_cat_id) ? string.Empty : (o.cat_parent_cat_id == null ? string.Empty : o.TM_CAT_Category2.cat_name),
                            PrdCount = o.TR_PCA_Product_Category.Count
                        };
        }

        public static TM_CAT_Category EntityToRepository(Category _from, TM_CAT_Category _to, bool create = false)
        {
            if (_to == null || create)
            {
                _to = new TM_CAT_Category { soc_id = _from.SocId };
            }
            _to.cat_parent_cat_id = _from.CatParentCatId == 0 ? (int?)null : _from.CatParentCatId;
            _to.cat_description = _from.CatDescription;
            _to.cat_display_in_menu = _from.CatDisplayInMenu;
            _to.cat_display_in_exhibition = _from.CatDisplayInExhibition;
            _to.cat_is_actived = _from.CatIsActived;
            _to.cat_name = _from.CatName;
            _to.cat_order = _from.CatOrder;
            _to.cat_sub_name_1 = _from.CatSubName1;
            _to.cat_sub_name_2 = _from.CatSubName2;
            return _to;
        }

        public static Expression<Func<TR_PCA_Product_Category, ProductInCategory>> PcaRepositoryToEntity(bool forSite = false)
        {
            return o => new ProductInCategory
            {
                Id = o.pca_id,
                Product = new Product
                {
                    PrdDescription = o.TM_PRD_Product.prd_description,
                    PrdId = o.prd_id,
                    PrdName = o.TM_PRD_Product.prd_name,
                    PrdPrice = o.TM_PRD_Product.prd_price,
                    PrdRef = o.TM_PRD_Product.prd_ref,
                    PrdPurchasePrice = o.TM_PRD_Product.prd_purchase_price,
                    PrdFileName = o.TM_PRD_Product.prd_file_name,
                    PrdCode = o.TM_PRD_Product.prd_code,
                    //PrdInsideDiameter = o.TM_PRD_Product.prd_inside_diameter,
                    PrdOutsideDiameter = o.TM_PRD_Product.prd_outside_diameter,
                    PrdLength = o.TM_PRD_Product.prd_length,
                    PrdWidth = o.TM_PRD_Product.prd_width,
                    PrdHeight = o.TM_PRD_Product.prd_height,
                    PrdHoleSize = o.TM_PRD_Product.prd_hole_size,
                    PrdDepth = o.TM_PRD_Product.prd_depth,
                    PrdWeight = o.TM_PRD_Product.prd_weight,
                    PrdUnitLength = o.TM_PRD_Product.prd_unit_length,
                    PrdUnitWidth = o.TM_PRD_Product.prd_unit_width,
                    PrdUnitHeight = o.TM_PRD_Product.prd_unit_height,
                    PrdUnitWeight = o.TM_PRD_Product.prd_unit_weight,
                    PrdQuantityEachCarton = o.TM_PRD_Product.prd_quantity_each_carton,
                    PrdCartonLength = o.TM_PRD_Product.prd_carton_length,
                    PrdCartonWidth = o.TM_PRD_Product.prd_carton_width,
                    PrdCartonHeight = o.TM_PRD_Product.prd_carton_height,
                    PrdCartonWeight = o.TM_PRD_Product.prd_carton_weight,
                    ProductType = o.TM_PRD_Product.TM_PTY_Product_Type.pty_name,
                    PrdImg = forSite ? o.TM_PRD_Product.TI_PIM_Product_Image.Any(l => l.pim_order == 10) ? o.TM_PRD_Product.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10).pim_path : string.Empty :
                    o.TM_PRD_Product.TI_PIM_Product_Image.Any() ? o.TM_PRD_Product.TI_PIM_Product_Image.FirstOrDefault().pim_path : string.Empty,
                    PtyId = o.TM_PRD_Product.pty_id,
                    PrdSepcifications = o.TM_PRD_Product.prd_specifications,
                    PrdSubName = o.TM_PRD_Product.prd_sub_name
                },
                Category = new Category
                {
                    CatId = o.cat_id,
                    CatDescription = o.TM_CAT_Category.cat_description,
                    CatImagePath = o.TM_CAT_Category.cat_image_path,
                    CatName = o.TM_CAT_Category.cat_name,
                },
                PcaDescription = o.pca_description
            };
        }

    }
}
