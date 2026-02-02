-- =============================================
-- Migration: V1.1.1.3 - Create TR_CAR_Carrier Table
-- Description: Creates the Carrier reference table for shipping/transport carriers
-- Date: 2026-01-31
-- =============================================

-- Create Carrier reference table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_CAR_Carrier]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.TR_CAR_Carrier
    (
        car_id              int identity(1,1)   primary key,
        soc_id              int                 not null,
        car_name            nvarchar(200)       not null,
        car_code            nvarchar(20)        null,
        car_phone           nvarchar(50)        null,
        car_email           nvarchar(200)       null,
        car_website         nvarchar(500)       null,
        car_tracking_url    nvarchar(500)       null,
        car_is_active       bit                 not null default(1),

        CONSTRAINT FK_CAR_SOC FOREIGN KEY (soc_id) REFERENCES TM_SOC_Society(soc_id),
        CONSTRAINT UQ_CAR_Code_Soc UNIQUE (soc_id, car_code)
    )

    -- Create index on soc_id for faster lookups
    CREATE NONCLUSTERED INDEX IX_CAR_SocId ON TR_CAR_Carrier(soc_id)

    PRINT 'Table TR_CAR_Carrier created successfully.'
END
ELSE
BEGIN
    PRINT 'Table TR_CAR_Carrier already exists.'
END
GO

-- Insert default carriers (common shipping companies)
-- Note: These are inserted for soc_id = 1 as default. Adjust as needed.
IF EXISTS (SELECT * FROM TM_SOC_Society WHERE soc_id = 1)
BEGIN
    IF NOT EXISTS (SELECT * FROM TR_CAR_Carrier WHERE car_code = 'FEDEX' AND soc_id = 1)
    BEGIN
        INSERT INTO TR_CAR_Carrier (soc_id, car_name, car_code, car_phone, car_email, car_website, car_tracking_url, car_is_active)
        VALUES
            (1, 'FedEx', 'FEDEX', NULL, NULL, 'https://www.fedex.com', 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}', 1),
            (1, 'UPS', 'UPS', NULL, NULL, 'https://www.ups.com', 'https://www.ups.com/track?tracknum={tracking_number}', 1),
            (1, 'DHL', 'DHL', NULL, NULL, 'https://www.dhl.com', 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}', 1),
            (1, 'TNT', 'TNT', NULL, NULL, 'https://www.tnt.com', 'https://www.tnt.com/express/en_gc/site/shipping-tools/track.html?searchType=con&cons={tracking_number}', 1),
            (1, 'La Poste', 'LAPOSTE', NULL, NULL, 'https://www.laposte.fr', 'https://www.laposte.fr/outils/suivre-vos-envois?code={tracking_number}', 1),
            (1, 'Chronopost', 'CHRONO', NULL, NULL, 'https://www.chronopost.fr', 'https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT={tracking_number}', 1),
            (1, 'Colissimo', 'COLISSIMO', NULL, NULL, 'https://www.colissimo.fr', 'https://www.laposte.fr/outils/suivre-vos-envois?code={tracking_number}', 1),
            (1, 'GLS', 'GLS', NULL, NULL, 'https://gls-group.eu', 'https://gls-group.eu/GROUP/en/parcel-tracking?match={tracking_number}', 1),
            (1, 'USPS', 'USPS', NULL, NULL, 'https://www.usps.com', 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}', 1),
            (1, 'China Post', 'CHINAPOST', NULL, NULL, 'https://www.chinapost.com.cn', 'https://track-chinapost.com/?id={tracking_number}', 1)

        PRINT 'Default carriers inserted successfully.'
    END
    ELSE
    BEGIN
        PRINT 'Default carriers already exist.'
    END
END
GO
