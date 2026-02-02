using System;
using System.ComponentModel;
using System.Data.Objects.DataClasses;
using System.Runtime.Serialization;
using System.Xml.Serialization;

namespace ERP.Repositories.DataBase
{
    /// <summary>
    /// Carrier entity for TR_CAR_Carrier table
    /// Used for shipping/transport carrier reference data
    /// </summary>
    [EdmEntityTypeAttribute(NamespaceName = "ERP_DBModel", Name = "TR_CAR_Carrier")]
    [Serializable()]
    [DataContractAttribute(IsReference = true)]
    public partial class TR_CAR_Carrier : EntityObject
    {
        #region Factory Method

        /// <summary>
        /// Create a new TR_CAR_Carrier object.
        /// </summary>
        /// <param name="car_id">Initial value of the car_id property.</param>
        /// <param name="soc_id">Initial value of the soc_id property.</param>
        /// <param name="car_name">Initial value of the car_name property.</param>
        /// <param name="car_is_active">Initial value of the car_is_active property.</param>
        public static TR_CAR_Carrier CreateTR_CAR_Carrier(global::System.Int32 car_id, global::System.Int32 soc_id, global::System.String car_name, global::System.Boolean car_is_active)
        {
            TR_CAR_Carrier tR_CAR_Carrier = new TR_CAR_Carrier();
            tR_CAR_Carrier.car_id = car_id;
            tR_CAR_Carrier.soc_id = soc_id;
            tR_CAR_Carrier.car_name = car_name;
            tR_CAR_Carrier.car_is_active = car_is_active;
            return tR_CAR_Carrier;
        }

        #endregion

        #region Simple Properties

        /// <summary>
        /// Carrier ID (Primary Key)
        /// </summary>
        [EdmScalarPropertyAttribute(EntityKeyProperty = true, IsNullable = false)]
        [DataMemberAttribute()]
        public global::System.Int32 car_id
        {
            get { return _car_id; }
            set
            {
                if (_car_id != value)
                {
                    Oncar_idChanging(value);
                    ReportPropertyChanging("car_id");
                    _car_id = value;
                    ReportPropertyChanged("car_id");
                    Oncar_idChanged();
                }
            }
        }
        private global::System.Int32 _car_id;
        partial void Oncar_idChanging(global::System.Int32 value);
        partial void Oncar_idChanged();

        /// <summary>
        /// Society ID (Foreign Key)
        /// </summary>
        [EdmScalarPropertyAttribute(EntityKeyProperty = false, IsNullable = false)]
        [DataMemberAttribute()]
        public global::System.Int32 soc_id
        {
            get { return _soc_id; }
            set
            {
                Onsoc_idChanging(value);
                ReportPropertyChanging("soc_id");
                _soc_id = value;
                ReportPropertyChanged("soc_id");
                Onsoc_idChanged();
            }
        }
        private global::System.Int32 _soc_id;
        partial void Onsoc_idChanging(global::System.Int32 value);
        partial void Onsoc_idChanged();

        /// <summary>
        /// Carrier name
        /// </summary>
        [EdmScalarPropertyAttribute(EntityKeyProperty = false, IsNullable = false)]
        [DataMemberAttribute()]
        public global::System.String car_name
        {
            get { return _car_name; }
            set
            {
                Oncar_nameChanging(value);
                ReportPropertyChanging("car_name");
                _car_name = value;
                ReportPropertyChanged("car_name");
                Oncar_nameChanged();
            }
        }
        private global::System.String _car_name;
        partial void Oncar_nameChanging(global::System.String value);
        partial void Oncar_nameChanged();

        /// <summary>
        /// Carrier code
        /// </summary>
        [EdmScalarPropertyAttribute(EntityKeyProperty = false, IsNullable = true)]
        [DataMemberAttribute()]
        public global::System.String car_code
        {
            get { return _car_code; }
            set
            {
                Oncar_codeChanging(value);
                ReportPropertyChanging("car_code");
                _car_code = value;
                ReportPropertyChanged("car_code");
                Oncar_codeChanged();
            }
        }
        private global::System.String _car_code;
        partial void Oncar_codeChanging(global::System.String value);
        partial void Oncar_codeChanged();

        /// <summary>
        /// Carrier phone
        /// </summary>
        [EdmScalarPropertyAttribute(EntityKeyProperty = false, IsNullable = true)]
        [DataMemberAttribute()]
        public global::System.String car_phone
        {
            get { return _car_phone; }
            set
            {
                Oncar_phoneChanging(value);
                ReportPropertyChanging("car_phone");
                _car_phone = value;
                ReportPropertyChanged("car_phone");
                Oncar_phoneChanged();
            }
        }
        private global::System.String _car_phone;
        partial void Oncar_phoneChanging(global::System.String value);
        partial void Oncar_phoneChanged();

        /// <summary>
        /// Carrier email
        /// </summary>
        [EdmScalarPropertyAttribute(EntityKeyProperty = false, IsNullable = true)]
        [DataMemberAttribute()]
        public global::System.String car_email
        {
            get { return _car_email; }
            set
            {
                Oncar_emailChanging(value);
                ReportPropertyChanging("car_email");
                _car_email = value;
                ReportPropertyChanged("car_email");
                Oncar_emailChanged();
            }
        }
        private global::System.String _car_email;
        partial void Oncar_emailChanging(global::System.String value);
        partial void Oncar_emailChanged();

        /// <summary>
        /// Carrier website
        /// </summary>
        [EdmScalarPropertyAttribute(EntityKeyProperty = false, IsNullable = true)]
        [DataMemberAttribute()]
        public global::System.String car_website
        {
            get { return _car_website; }
            set
            {
                Oncar_websiteChanging(value);
                ReportPropertyChanging("car_website");
                _car_website = value;
                ReportPropertyChanged("car_website");
                Oncar_websiteChanged();
            }
        }
        private global::System.String _car_website;
        partial void Oncar_websiteChanging(global::System.String value);
        partial void Oncar_websiteChanged();

        /// <summary>
        /// Carrier tracking URL template
        /// </summary>
        [EdmScalarPropertyAttribute(EntityKeyProperty = false, IsNullable = true)]
        [DataMemberAttribute()]
        public global::System.String car_tracking_url
        {
            get { return _car_tracking_url; }
            set
            {
                Oncar_tracking_urlChanging(value);
                ReportPropertyChanging("car_tracking_url");
                _car_tracking_url = value;
                ReportPropertyChanged("car_tracking_url");
                Oncar_tracking_urlChanged();
            }
        }
        private global::System.String _car_tracking_url;
        partial void Oncar_tracking_urlChanging(global::System.String value);
        partial void Oncar_tracking_urlChanged();

        /// <summary>
        /// Whether the carrier is active
        /// </summary>
        [EdmScalarPropertyAttribute(EntityKeyProperty = false, IsNullable = false)]
        [DataMemberAttribute()]
        public global::System.Boolean car_is_active
        {
            get { return _car_is_active; }
            set
            {
                Oncar_is_activeChanging(value);
                ReportPropertyChanging("car_is_active");
                _car_is_active = value;
                ReportPropertyChanged("car_is_active");
                Oncar_is_activeChanged();
            }
        }
        private global::System.Boolean _car_is_active;
        partial void Oncar_is_activeChanging(global::System.Boolean value);
        partial void Oncar_is_activeChanged();

        #endregion
    }
}
