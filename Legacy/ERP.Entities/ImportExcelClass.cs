using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class ImportExcelClass
    {
        public double? PtyId { get; set; }
        public object Type { get; set; }
        public double? SupId { get; set; }
        /// <summary>
        /// 2017-09-28
        /// </summary>
        public object TEMP_REFERENCE { get; set; }

        public object SUPPLIER_NAME { get; set; }
        public object SUPPLIER_REFERENCE { get; set; }
        /// <summary>
        /// 2017-09-25
        /// </summary>
        public object SUPPLIER_ADDRESS { get; set; }
        public object CONTACT_SUPPLIER { get; set; }

        public object ECOLED_REFERENCE { get; set; }
        /// <summary>
        /// 2017-09-25
        /// </summary>
        public object ECOLED_NEW_REFERENCE { get; set; }
        /// <summary>
        /// 2017-09-25
        /// </summary>
        public object PRODUCT_NAME { get; set; }


        public object PICTURE__Of_GOODS { get; set; }
        public object DESCRIPTION_OF_GOODS { get; set; }
        /// <summary>
        /// 2017-09-28
        /// </summary>
        public double? OUTSIDE_LENGHT { get; set; }
        /// <summary>
        /// 2017-09-28
        /// </summary>
        public double? OUTSIDE_WIDTH { get; set; }
        /// <summary>
        /// 2017-09-28
        /// </summary>
        public double? OUTSIDE_HEIGHT { get; set; }
        public double? OUTSIDE_DIAMETER_ { get; set; }
        /// <summary>
        /// 2017-09-28 NO USE
        /// </summary>
        public double? OUTSIDE_THICKNESS { get; set; }

        public double? LENGTH_IN_mm { get; set; }
        public double? WIDTH_IN_mm { get; set; }
        public double? HEIGHT_IN_mm { get; set; }
        /// <summary>
        /// 2017-09-28
        /// </summary>
        public double? DIAMETER_TOTAL { get; set; }
        /// <summary>
        /// 2017-09-28
        /// </summary>
        public double? HOLE_SIZE_LENGTH { get; set; }
        /// <summary>
        /// 2017-09-28
        /// </summary>
        public double? HOLE_SIZE_WIDTH { get; set; }
        /// <summary>
        /// hole size depth in
        /// </summary>
        public double? DEPTH_IN_ { get; set; }
        /// <summary>
        /// hole size diameter
        /// </summary>
        public double? HOLE_SIZE_IN_ { get; set; }
        public object BASE { get; set; }
        public object ELECTRICAL_CLASS { get; set; }
        public object MATERIAL_TYPE { get; set; }
        public object DIFUSER_TYPE { get; set; }
        public double? Color_2200K { get; set; }
        public double? Color_2600K { get; set; }
        public double? Color_3000K { get; set; }
        public double? Color_4000K { get; set; }
        public double? Color_5700K { get; set; }
        public double? Color_6000K { get; set; }
        public double? Color_6700K { get; set; }
        public double? Color_RED { get; set; }
        public double? Color_GREEN { get; set; }
        public double? Color_BLUE { get; set; }
        public double? Color_WHITE { get; set; }
        public double? Color_RGB { get; set; }
        public double? Operation_NORMAL { get; set; }
        public double? Operation_DIMMABLE { get; set; }
        public double? Operation_DALI { get; set; }
        public string IP { get; set; }
        public string IK { get; set; }
        public object BRAND_OF_LED { get; set; }
        public object MODEL_OF_LED { get; set; }
        public object DRIVER_BRAND { get; set; }
        public double? YIELD { get; set; }
        public double? WEIGHT_OF_PRODUCT { get; set; }
        public double? POWER_ATTS { get; set; }
        public object METER_POWER { get; set; }
        public object LED_BY_METER_STRIP_LED_or_LED_BAR { get; set; }
        public object VOLTAGE { get; set; }
        public double? LUMINOUS_FLOW_2600K { get; set; }
        public double? LUMINOUS_FLOW_3000K { get; set; }
        public double? LUMINOUS_FLOW_4000K { get; set; }
        public double? LUMINOUS_FLOW_5700K { get; set; }
        public double? LUMINOUS_FLOW_6000K { get; set; }
        public double? LUMINOUS_FLOW_6500K { get; set; }
        public double? LUMINOUS_FLOW_RED { get; set; }
        public double? LUMINOUS_FLOW_GREEN { get; set; }
        public double? LUMINOUS_FLOW_BLEU { get; set; }
        public double? REFERENCE_WHITE { get; set; }
        public double? REFERENCE_RGB { get; set; }
        public double? PRODUCT_LIFETIME { get; set; }
        public object UGR { get; set; }
        public object ELLIPSE_MacAdam { get; set; }
        public double? GUARANTY { get; set; }
        public object CARTON_SIZE_BY_UNIT { get; set; }
        public double? Unit_Carton_L { get; set; }
        public double? Unit_Carton_I { get; set; }
        public double? Unit_Carton_H { get; set; }
        public double? WEIGHT_BY_UNIT_KG { get; set; }
        public double? PACKAGING_PER_CARTONS_pcs { get; set; }
        public double? WEIGHT_PER_CARTONS_KG { get; set; }
        public double? Carton_L_mm { get; set; }
        public double? Carton_I_mm { get; set; }
        public double? Carton_H_mm { get; set; }
        public double? PRICE_FROM_SUPPLIER_1 { get; set; }
        public double? PRICE_FROM_SUPPLIER_100 { get; set; }
        public double? PRICE_FROM_SUPPLIER_500PCS { get; set; }
        public double? PUBLIC_PRICE_FROM_ECOLED { get; set; }
        public double? CoefPrice1_100 { get; set; }
        public double? CoefPrice100_500 { get; set; }


        public int lineNumber { get; set; }

        /// <summary>
        /// 2017-11-21 famille name
        /// </summary>
        public string PRODUCT_SUB_NAME { get; set; }
        public string IRC { get; set; }

        public double? COLOR_BLACK { get; set; }
        public double? COLOR_WHITE { get; set; }
        public double? COLOR_GREY { get; set; }
        public double? COLOR_DARKGREY { get; set; }
        public double? COLOR_SILVER { get; set; }
        public double? COLOR_YELLOW { get; set; }
        public double? COLOR_GREEN { get; set; }
        public double? COLOR_ORANGE { get; set; }

        /// <summary>
        /// 2017-11-22
        /// </summary>
        public string RefNormal { get; set; }
        /// <summary>
        /// 2017-11-22
        /// </summary>
        public string RefDim { get; set; }
        /// <summary>
        /// 2017-11-22
        /// </summary>
        public string RefDali { get; set; }
    }

    /// <summary>
    /// 20231017 导入 Suivi Admin 文件
    /// </summary>
    public class SuiviAdmin : ICloneable
    {

        /// <summary>
        /// 0 Mandataire
        /// </summary>
        public string Mandataire { get; set; }
        /// <summary>
        /// 1 Statut
        /// </summary>
        public string Statut { get; set; }
        /// <summary>
        /// 2 Commentaire
        /// </summary>
        public string Commentaire { get; set; }
        /// <summary>
        /// 3 "Regie NOM CLIENT" // Partenaire
        /// </summary>
        public string Client { get; set; }
        /// <summary>
        /// 5 N° DE COMMANDE
        /// </summary>
        public string CommandeNbr { get; set; }
        /// <summary>
        /// 6 Date signature devis
        /// </summary>
        public string SignatureDevisDate { get; set; }
        /// <summary>
        /// 7 Date de commande
        /// </summary>
        public string CommandeDate { get; set; }
        /// <summary>
        /// 8 Denomination sociale
        /// </summary>
        public string CommandeName { get; set; }
        /// <summary>
        /// 10 Contact
        /// </summary>
        public string Contact { get; set; }
        /// <summary>
        /// 11 Adresse
        /// </summary>
        public string Adresse { get; set; }
        /// <summary>
        /// 12 CP
        /// </summary>
        public string Postcode { get; set; }
        /// <summary>
        /// 13 Ville
        /// </summary>
        public string Ville { get; set; }
        /// <summary>
        /// 14 Dpt
        /// </summary>
        public string Departement { get; set; }
        /// <summary>
        /// 15 Portable
        /// </summary>
        public string Portable { get; set; }
        /// <summary>
        /// 16 Email
        /// </summary>
        public string Email { get; set; }
        /// <summary>
        /// 17 
        /// </summary>
        public int? Projecteur_30W { get; set; }
        /// <summary>
        /// 18
        /// </summary>
        public int? Projecteur_50W { get; set; }
        /// <summary>
        /// 19
        /// </summary>
        public int? Projecteur_100W { get; set; }
        /// <summary>
        /// 20
        /// </summary>
        public int? Projecteur_150W { get; set; }
        /// <summary>
        /// 21
        /// </summary>
        public int? Parc_Etanche_1m20 { get; set; }
        /// <summary>
        /// 22
        /// </summary>
        public int? Hublot_18W { get; set; }
        /// <summary>
        /// 23
        /// </summary>
        public int? Candelabres_50W { get; set; }
        /// <summary>
        /// 24
        /// </summary>
        public int? Candelabres_100W { get; set; }
        /// <summary>
        /// 25
        /// </summary>
        public int? Solaire_10W { get; set; }
        /// <summary>
        /// 26
        /// </summary>
        public int? TotalCheck { get; set; }
        public string XmlField { get; set; }
        /// <summary>
        /// google doc 内的行号，用于直接定位该行位置方便出BL号码
        /// </summary>
        public int? LineNb { get; set; }

        public object Clone()
        {
            return this.MemberwiseClone();
        }
    }

    /// <summary>
    /// 20251027
    /// </summary>
    public class LivraisonCdl :  ICloneable
    {
        public string COMPANY { get; set; }
        public string DATE { get; set; }
        public string CLIENT { get; set; }
        public string SIRET { get; set; }
        public string ADRESSE_DE_LIVRAISON { get; set; }
        public string CP_VILLE { get; set; }
        public string CONTACT_SUR_PLACE { get; set; }
        public string Adresse_MAIL { get; set; }
        public string NUMERO_TEL { get; set; }
        public int? QUANTITE_HIGHBAY_250W { get; set; }
        public int? QUANTITE_LINEAR_250W { get; set; }
        public string COMMENTAIRES { get; set; }
        public int NUMERO_DE_LIGNE { get; set; }
        public string XmlField { get; set; }
        public object Clone()
        {
            return this.MemberwiseClone();
        }

    }
}
