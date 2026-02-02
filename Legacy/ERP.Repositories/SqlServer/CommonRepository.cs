using System;
using System.Collections.Generic;
using System.Data.Objects.DataClasses;
using System.IO;
using System.Linq;
using System.Runtime;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer
{
    public class CommonRepository : BaseSqlServerRepository
    {
        #region client type

        public List<KeyValue> GetClientTypes()
        {
            var allcty = _db.TR_CTY_Client_Type.Select(m => new KeyValue
            {
                Key = m.cty_id,
                Value = m.cty_description
            }).OrderBy(l => l.Value).ToList();
            return allcty;
        }


        #endregion client type

        #region Country

        /// <summary>
        /// Get all countries from TR_COU_Country table
        /// </summary>
        /// <returns>List of KeyValue with country data</returns>
        public List<KeyValue> GetAllCountries()
        {
            var result = _db.TR_COU_Country.Select(m => new KeyValue
            {
                Key = m.cou_id,
                Value = m.cou_name,
                Value2 = m.cou_code,
                Value3 = m.cou_iso_code
            }).OrderBy(m => m.Value).ToList();
            return result;
        }

        /// <summary>
        /// Get a single country by ID
        /// </summary>
        /// <param name="countryId">Country ID</param>
        /// <returns>Country as KeyValue or null</returns>
        public KeyValue GetCountryById(int countryId)
        {
            var result = _db.TR_COU_Country
                .Where(m => m.cou_id == countryId)
                .Select(m => new KeyValue
                {
                    Key = m.cou_id,
                    Value = m.cou_name,
                    Value2 = m.cou_code,
                    Value3 = m.cou_iso_code
                }).FirstOrDefault();
            return result;
        }

        /// <summary>
        /// Get country as full entity
        /// </summary>
        /// <param name="countryId">Country ID</param>
        /// <returns>Country entity or null</returns>
        public Country GetCountryEntityById(int countryId)
        {
            var result = _db.TR_COU_Country
                .Where(m => m.cou_id == countryId)
                .Select(m => new Country
                {
                    Id = m.cou_id,
                    Name = m.cou_name,
                    Code = m.cou_code,
                    IsoCode = m.cou_iso_code
                }).FirstOrDefault();
            return result;
        }

        /// <summary>
        /// Get all countries as full entities
        /// </summary>
        /// <returns>List of Country entities</returns>
        public List<Country> GetAllCountryEntities()
        {
            var result = _db.TR_COU_Country.Select(m => new Country
            {
                Id = m.cou_id,
                Name = m.cou_name,
                Code = m.cou_code,
                IsoCode = m.cou_iso_code
            }).OrderBy(m => m.Name).ToList();
            return result;
        }

        /// <summary>
        /// Create a new country
        /// </summary>
        /// <param name="country">Country entity to create</param>
        /// <returns>ID of created country</returns>
        public int CreateCountry(Country country)
        {
            var newCountry = new TR_COU_Country
            {
                cou_name = country.Name,
                cou_code = country.Code,
                cou_iso_code = country.IsoCode
            };
            _db.TR_COU_Country.AddObject(newCountry);
            _db.SaveChanges();
            return newCountry.cou_id;
        }

        /// <summary>
        /// Update an existing country
        /// </summary>
        /// <param name="country">Country entity with updated values</param>
        /// <returns>True if updated, false if not found</returns>
        public bool UpdateCountry(Country country)
        {
            var existingCountry = _db.TR_COU_Country.FirstOrDefault(m => m.cou_id == country.Id);
            if (existingCountry == null)
            {
                return false;
            }

            existingCountry.cou_name = country.Name;
            existingCountry.cou_code = country.Code;
            existingCountry.cou_iso_code = country.IsoCode;
            _db.TR_COU_Country.ApplyCurrentValues(existingCountry);
            _db.SaveChanges();
            return true;
        }

        /// <summary>
        /// Delete a country by ID
        /// </summary>
        /// <param name="countryId">Country ID to delete</param>
        /// <returns>True if deleted, false if not found or in use</returns>
        public bool DeleteCountry(int countryId)
        {
            var country = _db.TR_COU_Country.FirstOrDefault(m => m.cou_id == countryId);
            if (country == null)
            {
                return false;
            }

            // Check if country is in use by regions
            var inUse = _db.TR_REG_Region.Any(m => m.cou_id == countryId);
            if (inUse)
            {
                return false;
            }

            _db.TR_COU_Country.DeleteObject(country);
            _db.SaveChanges();
            return true;
        }

        #endregion Country

        #region region ville

        public List<KeyValue> GetAllCommuneNameByPostcode(string postcode)
        {
            var result = _db.TR_CMU_Commune.Where(m => m.cmu_postcode.StartsWith(postcode)).Select(m => new KeyValue
            {
                Key = m.cmu_id,
                Value = m.cmu_name,
                Value2 = m.cmu_postcode
            }).OrderBy(m => m.Value).ToList();

            return result;
        }
        #endregion region ville

        #region currency

        public List<KeyValue> GetAllCurrency()
        {
            var result = new List<KeyValue>();
            try
            {
                result = _db.TR_CUR_Currency.Select(m => new KeyValue
                {
                    Key = m.cur_id,
                    Value = m.cur_designation,
                    Value2 = m.cur_symbol,
                    DcValue = m.TR_MCU_Main_Currency.OrderByDescending(l => l.mcu_rate_date).FirstOrDefault() != null ? m.TR_MCU_Main_Currency.OrderByDescending(l => l.mcu_rate_date).FirstOrDefault().mcu_rate_in : 0
                }).ToList();

            }
            catch (Exception ex)
            {
            }
            return result;
        }

        #endregion currency

        #region TVA

        public List<KeyValue> GetAllTVA()
        {
            var result = _db.TR_VAT_Vat.Select(m => new KeyValue
            {
                Key = m.vat_id,
                Value = m.vat_designation,
                DcValue = m.vat_vat_rate,
                Value2 = m.vat_description
            }).OrderBy(m => m.Value).ToList();

            return result;
        }

        #endregion TVA

        #region Payment Mode
        public List<KeyValue> GetPaymentMode()
        {
            var allpmo = _db.TR_PMO_Payment_Mode.Select(m => new KeyValue
            {
                Key = m.pmo_id,
                Value = m.pmo_designation
            }).ToList();
            return allpmo;
        }
        #endregion Payment Mode

        #region Payment Condition
        public List<KeyValue> GetPaymentCondition()
        {
            var allpco = _db.TR_PCO_Payment_Condition.Select(m => new KeyValue
            {
                Key = m.pco_id,
                Value = m.pco_designation,
                Actived = m.pco_active,
                Key2 = m.pco_numday,
                Key3 = m.pco_day_additional,
                Key4 = m.pco_end_month ? 1 : 0
            }).ToList();
            return allpco;
        }
        #endregion Payment Condition

        #region TRADE TERMS

        public List<KeyValue> GetTradeTerms()
        {
            var ttes = _db.TR_TTE_TRADE_TERMS.Select(l => new KeyValue
            {
                Key = l.tte_id,
                Value = l.tte_name,
                Actived = l.tte_actived,
                Value2 = l.tte_description
            }).ToList();
            return ttes;
        }

        #endregion TRADE TERMS

        #region Color

        public List<EntityColor> GetAllColor(int socId)
        {
            var allcolors = _db.TR_COR_Color.Where(m => m.soc_id == socId).Select(m => new EntityColor
            {
                Id = m.cor_id,
                SocId = m.soc_id,
                CorRed = m.cor_red,
                CorBlue = m.cor_blue,
                CorGreen = m.cor_green,
                CorName = m.cor_name,
                CorDescription = m.cor_description
            }).ToList();
            return allcolors;
        }

        public EntityColor GetOneColor(int socId, int corId)
        {
            var oneColor = _db.TR_COR_Color.Where(m => m.soc_id == socId && m.cor_id == corId).Select(m => new EntityColor
            {
                Id = m.cor_id,
                SocId = m.soc_id,
                CorRed = m.cor_red,
                CorBlue = m.cor_blue,
                CorGreen = m.cor_green,
                CorName = m.cor_name,
                CorDescription = m.cor_description
            }).FirstOrDefault();
            return oneColor;
        }

        public int CreateUpdateColor(EntityColor oneColor)
        {
            int corId = 0;
            bool iscreate = false;
            if (oneColor.Id != 0)
            {
                var checkCor = _db.TR_COR_Color.FirstOrDefault(m => m.soc_id == oneColor.SocId && m.cor_id == oneColor.Id);
                if (checkCor != null)
                {
                    checkCor.cor_name = oneColor.CorName;
                    checkCor.cor_red = oneColor.CorRed;
                    checkCor.cor_blue = oneColor.CorBlue;
                    checkCor.cor_green = oneColor.CorGreen;
                    checkCor.cor_description = oneColor.CorDescription;
                    _db.TR_COR_Color.ApplyCurrentValues(checkCor);
                    _db.SaveChanges();
                }
                else
                {
                    iscreate = true;
                }

            }
            if (iscreate)
            {
                var newCor = new TR_COR_Color
                {
                    cor_name = oneColor.CorName,
                    cor_red = oneColor.CorRed,
                    cor_blue = oneColor.CorBlue,
                    cor_green = oneColor.CorGreen,
                    cor_description = oneColor.CorDescription,
                    soc_id = oneColor.SocId,
                };
                _db.TR_COR_Color.AddObject(newCor);
                _db.SaveChanges();
                corId = newCor.cor_id;
            }
            return corId;
        }

        public bool DeleteColor(int socId, int corId)
        {
            bool deleted = false;
            var oneColor = _db.TR_COR_Color.FirstOrDefault(m => m.soc_id == socId && m.cor_id == corId);
            if (oneColor != null)
            {
                // todo: check in use
                var inUse = _db.TM_PTY_Product_Type.Any(m => m.cor_id == corId && m.soc_id == socId);
                if (!inUse)
                {
                    _db.TR_COR_Color.DeleteObject(oneColor);
                    _db.SaveChanges();
                    deleted = true;
                }
            }
            return deleted;
        }


        #endregion Color

        #region Civility
        public List<KeyValue> GetCivility()
        {
            var allpco = _db.TR_CIV_Civility.Select(m => new KeyValue
            {
                Key = m.civ_id,
                Value = m.civ_designation,
                Actived = m.civ_active
            }).ToList();
            return allpco;
        }
        #endregion Civility

        #region Activity
        public List<KeyValue> GetActivity()
        {
            var allpmo = _db.TR_ACT_Activity.Select(m => new KeyValue
            {
                Key = m.act_id,
                Value = m.act_designation
            }).OrderBy(m => m.Value).ToList();
            return allpmo;
        }
        #endregion Activity

        #region Unit of Measure

        /// <summary>
        /// Get all units of measure from TR_UOM_UnitOfMeasure table
        /// </summary>
        /// <returns>List of KeyValue with unit of measure data</returns>
        public List<KeyValue> GetAllUnitsOfMeasure()
        {
            var result = _db.TR_UOM_UnitOfMeasure.Select(m => new KeyValue
            {
                Key = m.uom_id,
                Value = m.uom_designation,
                Value2 = m.uom_code,
                Value3 = m.uom_description,
                Actived = m.uom_isactive
            }).OrderBy(m => m.Value).ToList();
            return result;
        }

        /// <summary>
        /// Get active units of measure only
        /// </summary>
        /// <returns>List of active KeyValue units of measure</returns>
        public List<KeyValue> GetActiveUnitsOfMeasure()
        {
            var result = _db.TR_UOM_UnitOfMeasure
                .Where(m => m.uom_isactive)
                .Select(m => new KeyValue
                {
                    Key = m.uom_id,
                    Value = m.uom_designation,
                    Value2 = m.uom_code,
                    Value3 = m.uom_description,
                    Actived = m.uom_isactive
                }).OrderBy(m => m.Value).ToList();
            return result;
        }

        /// <summary>
        /// Get a single unit of measure by ID
        /// </summary>
        /// <param name="uomId">Unit of Measure ID</param>
        /// <returns>Unit of Measure as KeyValue or null</returns>
        public KeyValue GetUnitOfMeasureById(int uomId)
        {
            var result = _db.TR_UOM_UnitOfMeasure
                .Where(m => m.uom_id == uomId)
                .Select(m => new KeyValue
                {
                    Key = m.uom_id,
                    Value = m.uom_designation,
                    Value2 = m.uom_code,
                    Value3 = m.uom_description,
                    Actived = m.uom_isactive
                }).FirstOrDefault();
            return result;
        }

        /// <summary>
        /// Get unit of measure as full entity
        /// </summary>
        /// <param name="uomId">Unit of Measure ID</param>
        /// <returns>UnitOfMeasure entity or null</returns>
        public UnitOfMeasure GetUnitOfMeasureEntityById(int uomId)
        {
            var result = _db.TR_UOM_UnitOfMeasure
                .Where(m => m.uom_id == uomId)
                .Select(m => new UnitOfMeasure
                {
                    Id = m.uom_id,
                    Code = m.uom_code,
                    Designation = m.uom_designation,
                    Description = m.uom_description,
                    IsActive = m.uom_isactive
                }).FirstOrDefault();
            return result;
        }

        /// <summary>
        /// Get all units of measure as full entities
        /// </summary>
        /// <returns>List of UnitOfMeasure entities</returns>
        public List<UnitOfMeasure> GetAllUnitOfMeasureEntities()
        {
            var result = _db.TR_UOM_UnitOfMeasure.Select(m => new UnitOfMeasure
            {
                Id = m.uom_id,
                Code = m.uom_code,
                Designation = m.uom_designation,
                Description = m.uom_description,
                IsActive = m.uom_isactive
            }).OrderBy(m => m.Designation).ToList();
            return result;
        }

        /// <summary>
        /// Create a new unit of measure
        /// </summary>
        /// <param name="uom">UnitOfMeasure entity to create</param>
        /// <returns>ID of created unit of measure</returns>
        public int CreateUnitOfMeasure(UnitOfMeasure uom)
        {
            var newUom = new TR_UOM_UnitOfMeasure
            {
                uom_code = uom.Code,
                uom_designation = uom.Designation,
                uom_description = uom.Description,
                uom_isactive = uom.IsActive
            };
            _db.TR_UOM_UnitOfMeasure.AddObject(newUom);
            _db.SaveChanges();
            return newUom.uom_id;
        }

        /// <summary>
        /// Update an existing unit of measure
        /// </summary>
        /// <param name="uom">UnitOfMeasure entity with updated values</param>
        /// <returns>True if updated, false if not found</returns>
        public bool UpdateUnitOfMeasure(UnitOfMeasure uom)
        {
            var existingUom = _db.TR_UOM_UnitOfMeasure.FirstOrDefault(m => m.uom_id == uom.Id);
            if (existingUom == null)
            {
                return false;
            }

            existingUom.uom_code = uom.Code;
            existingUom.uom_designation = uom.Designation;
            existingUom.uom_description = uom.Description;
            existingUom.uom_isactive = uom.IsActive;
            _db.TR_UOM_UnitOfMeasure.ApplyCurrentValues(existingUom);
            _db.SaveChanges();
            return true;
        }

        /// <summary>
        /// Delete a unit of measure by ID
        /// </summary>
        /// <param name="uomId">Unit of Measure ID to delete</param>
        /// <returns>True if deleted, false if not found or in use</returns>
        public bool DeleteUnitOfMeasure(int uomId)
        {
            var uom = _db.TR_UOM_UnitOfMeasure.FirstOrDefault(m => m.uom_id == uomId);
            if (uom == null)
            {
                return false;
            }

            // TODO: Check if unit of measure is in use by products/orders
            // var inUse = _db.TM_PRD_Product.Any(m => m.uom_id == uomId);
            // if (inUse)
            // {
            //     return false;
            // }

            _db.TR_UOM_UnitOfMeasure.DeleteObject(uom);
            _db.SaveChanges();
            return true;
        }

        #endregion Unit of Measure

        #region File operation

        public void DeleteFile(string filepath)
        {
            try
            {
                if (string.IsNullOrEmpty(filepath))
                {
                    return;
                }
                FileStream stream = null;
                bool fileInUse = false;
                try
                {
                    if (File.Exists(filepath))
                    {
                        var file = new FileInfo(filepath);
                        stream = file.Open(FileMode.Open, FileAccess.Read, FileShare.None);
                    }
                }
                catch (IOException)
                {
                    fileInUse = true;
                    //the file is unavailable because it is:
                    //still being written to
                    //or being processed by another thread
                    //or does not exist (has already been processed)
                }
                finally
                {
                    if (stream != null)
                        stream.Close();
                }
                if (fileInUse)
                {
                    AddFile2Recycle(filepath);
                }
                else
                {
                    File.Delete(filepath);
                    _deleteFolder(filepath);
                }
            }
            catch (Exception)
            {
                AddFile2Recycle(filepath);
            }
        }

        public void AddFile2Recycle(string filepath)
        {
            var file2delete = new TR_FRE_File_Recycle
            {
                fre_path = filepath,
                fre_d_create = DateTime.Now
            };
            _db.TR_FRE_File_Recycle.AddObject(file2delete);
            _db.SaveChanges();
        }

        /// <summary>
        /// 垃圾文件清理
        /// </summary>
        public void DeleteAllFileInRecycle()
        {
            var files = _db.TR_FRE_File_Recycle.ToList();
            foreach (var fre in files)
            {
                try
                {
                    var filePath = fre.fre_path;
                    File.Delete(filePath);
                    _db.TR_FRE_File_Recycle.DeleteObject(fre);
                    _db.SaveChanges();
                    _deleteFolder(filePath);
                }
                catch (Exception)
                {
                }
            }
        }

        private void _deleteFolder(string filepath)
        {
            var foldername = Path.GetDirectoryName(filepath);
            if (IsDirectoryEmpty(foldername))
            {
                // 彻底删除
                if (foldername != null) Directory.Delete(foldername, false);
            }
        }

        public bool IsDirectoryEmpty(string path)
        {
            return !Directory.EnumerateFileSystemEntries(path).Any();
        }

        #endregion File operation

        #region Line Type
        public List<KeyValue> GetAllLineType()
        {
            var result = _db.TR_LTP_Line_Type.Where(m => m.ltp_isactive).Select(m => new KeyValue
            {
                Key = m.ltp_id,
                Value = m.ltp_name,
                Value2 = m.ltp_description
            }).OrderByDescending(m => m.Value).ToList();
            return result;
        }
        #endregion Line Type

        #region Text Header Footer

        public int InsertHeaderFooter(HeaderFooterText headerfooter)
        {
            var nthf = new TR_THF_Text_Header_Footer
            {
                thf_header = headerfooter.CostPlanHeader,
                thf_footer = headerfooter.CostPlanFooter,
                thf_cin_header = headerfooter.OtherHeader,
                thf_cin_footer = headerfooter.OtherFooter,
                thf_dlv_footer_condition = headerfooter.DeliveryFooterCondition,
                thf_dlv_footer_law = headerfooter.DeliveryFooterLaw,
                thf_cin_discount_for_prepayment = headerfooter.ClientInvoiceDiscountForPrepayment,
                thf_cin_penality = headerfooter.ClientInvoicePenality,
                thr_cin_email_footer = headerfooter.ClinetInvoiceEmail
            };
            _db.TR_THF_Text_Header_Footer.AddObject(nthf);
            _db.SaveChanges();
            return nthf.thf_id;
        }

        public void UpdateHeaderFooter(HeaderFooterText headerfooter)
        {
            var thf = _db.TR_THF_Text_Header_Footer.FirstOrDefault(m => m.thf_id == 1);

            if (thf != null)
            {
                thf.thf_header = headerfooter.CostPlanHeader;
                thf.thf_footer = headerfooter.CostPlanFooter;
                thf.thf_cin_header = headerfooter.OtherHeader;
                thf.thf_cin_footer = headerfooter.OtherFooter;
                thf.thf_dlv_footer_condition = headerfooter.DeliveryFooterCondition;
                thf.thf_dlv_footer_law = headerfooter.DeliveryFooterLaw;
                thf.thf_cin_discount_for_prepayment = headerfooter.ClientInvoiceDiscountForPrepayment;
                thf.thf_cin_penality = headerfooter.ClientInvoicePenality;
                thf.thr_cin_email_footer = headerfooter.ClinetInvoiceEmail;
                _db.TR_THF_Text_Header_Footer.ApplyCurrentValues(thf);
                _db.SaveChanges();
            }
        }

        public HeaderFooterText GetHeaderFooter()
        {
            var thf = _db.TR_THF_Text_Header_Footer.FirstOrDefault(m => m.thf_id == 1);
            if (thf != null)
            {
                return new HeaderFooterText
                {
                    Id = thf.thf_id,
                    CostPlanHeader = thf.thf_header,
                    CostPlanFooter = thf.thf_footer,
                    OtherHeader = thf.thf_cin_header,
                    OtherFooter = thf.thf_cin_footer,
                    DeliveryFooterCondition = thf.thf_dlv_footer_condition,
                    DeliveryFooterLaw = thf.thf_dlv_footer_law,
                    ClientInvoiceDiscountForPrepayment = thf.thf_cin_discount_for_prepayment,
                    ClientInvoicePenality = thf.thf_cin_penality,
                    ClinetInvoiceEmail = thf.thr_cin_email_footer
                };
            }
            else
            {
                return null;
            }
        }

        #endregion Text Header Footer

        #region Costplan statut

        public List<KeyValue> GetAllStatus()
        {
            var status = _db.TR_CST_CostPlan_Statut.Where(m => m.cst_isactive).Select(m => new KeyValue
            {
                Key = m.cst_id,
                Value = m.cst_designation
            }).OrderBy(m => m.Value).ToList();
            return status;
        }

        #endregion Costplan statut

        #region Status

        public List<KeyValue> GetAllGeneralStatus()
        {
            var status = _db.TR_STT_Status.Where(m => m.stt_actived).Select(m => new KeyValue
            {
                Key = m.stt_id,
                Value = m.stt_value,
                Key4 = m.stt_order,
                Value2 = m.stt_description
            }).OrderBy(m => m.Key4
          ).ToList();
            return status;
        }


        #endregion Status


        #region Language

        public List<KeyValue> GetAllLanguage()
        {
            var result = new List<KeyValue>();
            try
            {
                result = _db.TR_LNG_Language.Select(m => new KeyValue
                {
                    Key = m.lng_id,
                    Value = m.lng_label,
                    Value2 = m.lng_short_label
                }).ToList();

            }
            catch (Exception ex)
            {
            }
            return result;
        }
        #endregion Language

        #region Files

        public List<KeyValue> GetFiles(List<int> docIds)
        {
            var sodIds =
                _db.TI_DOC_Document.Where(l => docIds.Contains(l.doc_id) && l.doc_foreign_id.HasValue)
                    .Select(l => new KeyValue { Key2 = l.doc_foreign_id.Value, Key = l.doc_id })
                    .OrderByDescending(l => l.Key)
                    .Distinct()
                    .ToList();
            return sodIds;
        }

        public List<int> SaveUpdateDocuments(string dtpName, List<KeyValue> docsList)
        {
            var docIds = new List<int>();
            var dtp = _db.TR_DTP_Document_Type.FirstOrDefault(l => l.dtp_name == dtpName);
            // to insert
            var newDocs = Enumerable.Select(docsList.Where(l => l.Key == 0), m => new TI_DOC_Document
            {
                doc_d_update = m.DValue,
                doc_foreign_id = (int)m.Key2,
                dtp_id = dtp.dtp_id,
                doc_name = string.IsNullOrEmpty(m.Value2) ? "" : m.Value2,
                doc_description = m.Value,
                doc_path = "", // 由于数据库原因，插入空置
            }).ToList();

            foreach (var onespr in newDocs)
            {
                _db.TI_DOC_Document.AddObject(onespr);
                _db.SaveChanges();
                docIds.Add(onespr.doc_id);
            }

            // to update
            var sprwithId = docsList.Where(l => l.Key > 0);
            var oldsdc = (from sprid in sprwithId
                          join sprdb in _db.TI_DOC_Document on sprid.Key equals sprdb.doc_id
                          select new { sprdb, sprid }).ToList();
            foreach (var onesdc in oldsdc)
            {
                onesdc.sprdb.doc_description = onesdc.sprid.Value;
                onesdc.sprdb.doc_d_update = onesdc.sprid.DValue;
                onesdc.sprdb.doc_name = string.IsNullOrEmpty(onesdc.sprid.Value2) ? "" : onesdc.sprid.Value2;
                _db.TI_DOC_Document.ApplyCurrentValues(onesdc.sprdb);
                docIds.Add(onesdc.sprdb.doc_id);
            }
            _db.SaveChanges();

            return docIds.Distinct().ToList();
        }

        public List<KeyValue> GetDocumentList(string dtpName, int foreignId)
        {
            var sprs = (from dtp in _db.TR_DTP_Document_Type
                        join doc in _db.TI_DOC_Document on dtp.dtp_id equals doc.dtp_id
                        where dtp.dtp_name == dtpName && doc.doc_foreign_id.HasValue && doc.doc_foreign_id == foreignId
                        select doc).Select(l => new KeyValue
                        {
                            Key = l.doc_id,
                            Key2 = l.doc_foreign_id.Value,
                            DValue = l.doc_d_update,
                            Value = l.doc_description,
                            Value2 = l.doc_path
                        }).OrderBy(l => l.Key).ToList();
            return sprs;
        }

        public void UpdateDocumentFiles(List<int> docIds, string filePath)
        {
            var sprs = _db.TI_DOC_Document.Where(l => docIds.Contains(l.doc_id)).ToList();
            foreach (var onespr in sprs)
            {
                var oldPath = onespr.doc_path;
                DeleteFile(oldPath);
                onespr.doc_path = filePath;
                _db.TI_DOC_Document.ApplyCurrentValues(onespr);
                _db.SaveChanges();
            }
        }

        public KeyValue LoadDocumentFile(int foreignId, int docId)
        {
            var cpy = _db.TI_DOC_Document.Where(m => m.doc_foreign_id == foreignId && m.doc_id == docId).Select(m => new KeyValue
            {
                Value = m.doc_path,
                Value2 = m.doc_description
            }).FirstOrDefault();
            return cpy;
        }

        public int UpdateDocumentFile(string dtpName, int foreignId, int docId, string filePath)
        {
            int doc_id = 0;
            var onespr = _db.TI_DOC_Document.FirstOrDefault(l => l.TR_DTP_Document_Type.dtp_name == dtpName && l.doc_foreign_id == foreignId && l.doc_id == docId);
            if (onespr != null)
            {
                doc_id = onespr.doc_id;
                var oldPath = onespr.doc_path;
                DeleteFile(oldPath);
                onespr.doc_path = string.IsNullOrEmpty(filePath) ? "" : filePath;
                _db.TI_DOC_Document.ApplyCurrentValues(onespr);
                _db.SaveChanges();
            }
            return doc_id;
        }

        public string GetDocumentSavePath(string dtpName)
        {
            var path = _db.TR_DTP_Document_Type.FirstOrDefault(l => l.dtp_name == dtpName);
            return path != null ? path.dtp_file_path : null;
        }

        #endregion Files

        #region Carrier

        /// <summary>
        /// Get all carriers for a society
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <returns>List of KeyValue with carrier data</returns>
        public List<KeyValue> GetAllCarriers(int socId)
        {
            var result = _db.TR_CAR_Carrier
                .Where(m => m.soc_id == socId)
                .Select(m => new KeyValue
                {
                    Key = m.car_id,
                    Value = m.car_name,
                    Value2 = m.car_code,
                    Actived = m.car_is_active
                }).OrderBy(m => m.Value).ToList();
            return result;
        }

        /// <summary>
        /// Get all active carriers for a society
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <returns>List of KeyValue with active carrier data</returns>
        public List<KeyValue> GetActiveCarriers(int socId)
        {
            var result = _db.TR_CAR_Carrier
                .Where(m => m.soc_id == socId && m.car_is_active)
                .Select(m => new KeyValue
                {
                    Key = m.car_id,
                    Value = m.car_name,
                    Value2 = m.car_code,
                    Actived = m.car_is_active
                }).OrderBy(m => m.Value).ToList();
            return result;
        }

        /// <summary>
        /// Get a single carrier by ID
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="carrierId">Carrier ID</param>
        /// <returns>Carrier entity or null</returns>
        public Carrier GetCarrierById(int socId, int carrierId)
        {
            var result = _db.TR_CAR_Carrier
                .Where(m => m.soc_id == socId && m.car_id == carrierId)
                .Select(Translators.CarrierTranslator.RepositoryToEntity())
                .FirstOrDefault();
            return result;
        }

        /// <summary>
        /// Get all carriers as full entities
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <returns>List of Carrier entities</returns>
        public List<Carrier> GetAllCarrierEntities(int socId)
        {
            var result = _db.TR_CAR_Carrier
                .Where(m => m.soc_id == socId)
                .Select(Translators.CarrierTranslator.RepositoryToEntity())
                .OrderBy(m => m.Name).ToList();
            return result;
        }

        /// <summary>
        /// Create or update a carrier
        /// </summary>
        /// <param name="carrier">Carrier entity to create or update</param>
        /// <returns>ID of created/updated carrier</returns>
        public int CreateUpdateCarrier(Carrier carrier)
        {
            int carId = 0;
            bool isCreate = false;

            if (carrier.Id != 0)
            {
                var existing = _db.TR_CAR_Carrier.FirstOrDefault(m => m.soc_id == carrier.SocId && m.car_id == carrier.Id);
                if (existing != null)
                {
                    existing = Translators.CarrierTranslator.EntityToRepository(carrier, existing);
                    _db.TR_CAR_Carrier.ApplyCurrentValues(existing);
                    _db.SaveChanges();
                    carId = existing.car_id;
                }
                else
                {
                    isCreate = true;
                }
            }
            else
            {
                isCreate = true;
            }

            if (isCreate)
            {
                var newCarrier = new TR_CAR_Carrier();
                newCarrier = Translators.CarrierTranslator.EntityToRepository(carrier, newCarrier, true);
                _db.TR_CAR_Carrier.AddObject(newCarrier);
                _db.SaveChanges();
                carId = newCarrier.car_id;
            }

            return carId;
        }

        /// <summary>
        /// Delete a carrier by ID
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <param name="carrierId">Carrier ID to delete</param>
        /// <returns>True if deleted, false if not found or in use</returns>
        public bool DeleteCarrier(int socId, int carrierId)
        {
            var carrier = _db.TR_CAR_Carrier.FirstOrDefault(m => m.soc_id == socId && m.car_id == carrierId);
            if (carrier == null)
            {
                return false;
            }

            // TODO: Add check if carrier is in use by delivery forms or other entities
            // var inUse = _db.SomeTable.Any(m => m.car_id == carrierId);
            // if (inUse) return false;

            _db.TR_CAR_Carrier.DeleteObject(carrier);
            _db.SaveChanges();
            return true;
        }

        #endregion Carrier

        /// <summary>
        /// 清理系统垃圾
        /// </summary>
        public void CleanUpGarbage()
        {
            // 清理文件
            DeleteAllFileInRecycle();
        }
    }
}
