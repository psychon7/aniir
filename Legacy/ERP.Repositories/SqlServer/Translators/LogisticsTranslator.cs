using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class LogisticsTranslator
    {
        public static Expression<Func<TM_LGS_Logistic, Logistics>> RepositoryToEntity()
        {
            return o => new Logistics
            {
                SocId = o.soc_id,
                Id = o.lgs_id,
                LgsCode = o.lgs_code,
                LgsName = o.lgs_name,
                LgsIsSent = o.lgs_is_send,
                SupId = o.sup_id,
                LgsDateSend = o.lgs_d_send,
                LgsDateArrivePre = o.lgs_d_arrive_pre,
                LgsDateArrive = o.lgs_d_arrive,
                LgsComment = o.lgs_comment,
                LgsFile = o.lgs_file,
                LgsGuid = o.lgs_guid ?? new Guid(),
                LgsIsPurchase = o.lgs_is_purchase,
                LgsTrackingNumber = o.lgs_tracking_number,
                UsrCreatorId = o.usr_id_creator,
                Creator = new User
                {
                    Firstname = o.TM_USR_User.usr_firstname,
                    Lastname = o.TM_USR_User.usr_lastname
                },
                DateCreation = o.lgs_d_creation,
                DateUpdate = o.lgs_d_update,
                Supplier = new Supplier
                           {
                               CompanyName = o.sup_id.HasValue ? o.TM_SUP_Supplier.sup_company_name : string.Empty,
                               Tel1 = o.sup_id.HasValue ? o.TM_SUP_Supplier.sup_tel1 : string.Empty,
                               Tel2 = o.sup_id.HasValue ? o.TM_SUP_Supplier.sup_tel2 : string.Empty,
                               Email = o.sup_id.HasValue ? o.TM_SUP_Supplier.sup_email : string.Empty,
                               Abbreviation = o.sup_id.HasValue ? o.TM_SUP_Supplier.sup_abbreviation : string.Empty,
                               Reference = o.TM_SUP_Supplier.sup_ref,
                               Address1 = o.TM_SUP_Supplier.sup_address1,
                               Address2 = o.TM_SUP_Supplier.sup_address2,
                               Postcode = o.TM_SUP_Supplier.sup_postcode,
                               City = o.TM_SUP_Supplier.sup_city,
                               Country = o.TM_SUP_Supplier.sup_country,
                               Fax = o.TM_SUP_Supplier.sup_fax,
                               Cellphone = o.TM_SUP_Supplier.sup_cellphone,

                           },
                LgsIsReceived = o.lgs_is_received,
                LgsIsStockIn = o.lgs_is_stockin,
                LgsDateStockIn = o.lgs_d_stockin,
                ConId = o.con_id ?? 0,
                Consignee = new Consignee
                {
                    ConCompanyname = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_company_name : string.Empty,
                    ConFirstname = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_firstname : string.Empty,
                    ConLastname = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_lastname : string.Empty,
                    ConCode = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_code : string.Empty,
                    ConAdresseTitle = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_adresse_title : string.Empty,
                    ConAddress1 = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_address1 : string.Empty,
                    ConAddress2 = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_address2 : string.Empty,
                    ConAddress3 = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_address3 : string.Empty,
                    ConPostcode = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_postcode : string.Empty,
                    ConCity = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_city : string.Empty,
                    ConCountry = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_country : string.Empty,
                    ConTel1 = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_tel1 : string.Empty,
                    ConTel2 = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_tel2 : string.Empty,
                    ConFax = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_fax : string.Empty,
                    ConCellphone = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_cellphone : string.Empty,
                    ConEmail = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_email : string.Empty,
                    ConRecieveNewsletter = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_recieve_newsletter : false,
                    ConNewsletterEmail = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_newsletter_email : string.Empty,
                    ConIsDeliveryAdr = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_is_delivery_adr : false,
                    ConIsInvoicingAdr = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.con_is_invoicing_adr : false,
                    Civility = new KeyValue { Value = o.con_id.HasValue ? o.TM_CON_CONSIGNEE.TR_CIV_Civility.civ_designation : string.Empty }
                },
                SodId = o.sod_id ?? 0,
                SodCode = o.sod_id.HasValue ? o.TM_SOD_Supplier_Order.sod_code : string.Empty
            };
        }

        public static TM_LGS_Logistic EntityToRepository(Logistics _from, TM_LGS_Logistic _to, bool create = false)
        {
            if (create)
            {
                _to.lgs_code = _from.LgsCode;
                _to.soc_id = _from.SocId;
                _to.usr_id_creator = _from.UsrCreatorId;
                _to.lgs_d_creation = _from.DateCreation;
                _to.lgs_guid = Guid.NewGuid();
            }
            _to.lgs_name = _from.LgsName;
            _to.lgs_is_send = _from.LgsIsSent;
            _to.sup_id = _from.SupId;
            _to.lgs_d_send = _from.LgsDateSend;
            _to.lgs_d_arrive_pre = _from.LgsDateArrivePre;
            _to.lgs_d_arrive = _from.LgsDateArrive;
            _to.lgs_comment = _from.LgsComment;
            _to.lgs_is_purchase = _from.LgsIsPurchase;
            _to.lgs_tracking_number = _from.LgsTrackingNumber;
            _to.lgs_d_update = _from.DateUpdate;
            _to.lgs_is_received = _from.LgsIsReceived;
            _to.lgs_is_stockin = _from.LgsIsStockIn;
            _to.con_id = _from.ConId <= 0 ? (int?)null : _from.ConId;
            _to.sod_id = _from.SodId <= 0 ? (int?)null : _from.SodId;
            return _to;
        }

        public static Expression<Func<TM_LGL_Logistic_Lines, LogisticsLine>> RepositoryToEntityLgl()
        {
            return o => new LogisticsLine
            {
                Id = o.lgl_id,
                PrdId = o.prd_id,
                PitId = o.pit_id,
                LglDescription = o.lgs_description,
                LglGuid = o.lgl_guid ?? Guid.NewGuid(),
                LglQuantity = o.lgs_quantity,
                LgsId = o.lgs_id,
                ProductName = o.lgs_prd_name,
                ProductRef = o.lgs_prd_ref,
                SilId = o.sil_id,
                LglUnitPrice = o.lgs_unit_price,
                TotalPrice = o.lgs_total_price,
                SinId = o.sil_id.HasValue ? o.TM_SIL_SupplierInvoice_Lines.sin_id : 0,
                SinCode = o.sil_id.HasValue ? o.TM_SIL_SupplierInvoice_Lines.TM_SIN_Supplier_Invoice.sin_code : string.Empty,
                //LglQuantityTotal = o.sil_id.HasValue ? o.TM_SIL_SupplierInvoice_Lines.sil_quantity : o.lgs_quantity,
                PrdDescription = o.lgl_prd_des,
                PrdImage = o.prd_id.HasValue && o.TM_PRD_Product.TI_PIM_Product_Image.Any()
                                ? (o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                                    ? o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                                    : o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                                : string.Empty,
                SolId = o.sol_id,
                CiiId = o.cii_id,
                CinCode = o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line.TM_CIN_Client_Invoice.cin_code : string.Empty,
                CinId = o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line.cin_id : (int?)null,
                Client = o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line.TM_CIN_Client_Invoice.TM_CLI_CLient.cli_company_name : string.Empty,
            };
        }

        public static TM_LGL_Logistic_Lines EntityToRepositoryLgl(LogisticsLine _from, TM_LGL_Logistic_Lines _to, bool create = false)
        {
            if (create || _to == null)
            {
                _to = new TM_LGL_Logistic_Lines();
                _to.lgs_id = _from.LgsId;
                _to.lgl_guid = Guid.NewGuid();
                _to.sil_id = _from.SilId == 0 ? null : _from.SilId;
                _to.sol_id = _from.SolId == 0 ? null : _from.SolId;
            }
            _to.prd_id = _from.PrdId == 0 ? null : _from.PrdId;
            _to.pit_id = _from.PitId == 0 ? null : _from.PitId;
            _to.lgs_description = _from.LglDescription;
            _to.lgs_quantity = _from.LglQuantity;
            _to.lgs_prd_name = _from.ProductName;
            _to.lgs_prd_ref = _from.ProductRef;
            _to.lgs_total_price = _from.TotalPrice;
            _to.lgs_unit_price = _from.LglUnitPrice;
            _to.lgl_prd_des = _from.PrdDescription;
            return _to;
        }
    }
}
