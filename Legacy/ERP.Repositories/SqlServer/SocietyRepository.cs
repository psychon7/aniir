using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class SocietyRepository : BaseSqlServerRepository
    {
        public int CreateUpdateSociety(Society oneSociety)
        {
            int cliId = 0;
            bool create = false;
            if (oneSociety.Id != 0)
            {
                var cli = _db.TR_SOC_Society.FirstOrDefault(m => m.soc_id == oneSociety.Id);
                if (cli != null)
                {
                    cli = SocietyTranslator.EntityToRepository(oneSociety, cli);
                    _db.TR_SOC_Society.ApplyCurrentValues(cli);
                    _db.SaveChanges();
                    cliId = cli.soc_id;
                }
                else
                {
                    create = true;
                }
            }
            else
            {
                create = true;
            }
            if (create)
            {
                var newSociety = new TR_SOC_Society();
                newSociety = SocietyTranslator.EntityToRepository(oneSociety, newSociety, true);
                _db.TR_SOC_Society.AddObject(newSociety);
                _db.SaveChanges();
                cliId = newSociety.soc_id;
            }
            return cliId;
        }

        public int CheckSocietyExisted(int socId, string companyName)
        {
            var oneSociety = _db.TR_SOC_Society.FirstOrDefault(m => m.soc_id == socId && m.soc_society_name == companyName);
            return oneSociety == null ? 0 : 1;
        }

        public Society LoadSocietyById(int socId)
        {
            var aSociety = _db.TR_SOC_Society.Where(m => m.soc_id == socId).Select(SocietyTranslator.RepositoryToEntity()).FirstOrDefault();
            var mainCur = _db.TR_MCU_Main_Currency.OrderByDescending(l => l.mcu_rate_date).FirstOrDefault();
            if (mainCur != null && aSociety != null)
            {
                var allCur =
                    _db.TR_MCU_Main_Currency.Where(l => l.mcu_rate_date == mainCur.mcu_rate_date)
                        .Select(l => new Currencies
                        {
                            Name = l.TR_CUR_Currency.cur_designation,
                            SellingRate = l.mcu_rate_in,
                            UpdateTime = l.mcu_rate_date
                        }).ToList();
                aSociety.CurList = allCur;
            }
            return aSociety;
        }

        public List<Society> SearchSociety(Society searchSociety)
        {
            var socs = _db.TR_SOC_Society.Where(m => m.soc_id == searchSociety.Id
                && (string.IsNullOrEmpty(searchSociety.Society_Name.Trim()) || m.soc_society_name.StartsWith(searchSociety.Society_Name.Trim()))
                && (string.IsNullOrEmpty(searchSociety.Email.Trim()) || m.soc_email.StartsWith(searchSociety.Email.Trim()))
                && (string.IsNullOrEmpty(searchSociety.PostCode.Trim()) || m.soc_postcode.StartsWith(searchSociety.PostCode.Trim()))
                && (string.IsNullOrEmpty(searchSociety.City.Trim()) || m.soc_city.StartsWith(searchSociety.City.Trim()))
                && (string.IsNullOrEmpty(searchSociety.Telephone.Trim()) || m.soc_tel.StartsWith(searchSociety.Telephone.Trim()))
                ).Select(SocietyTranslator.RepositoryToEntity()).OrderBy(m => m.Society_Name).ToList();

            foreach (var item in socs)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "socId");
            }
            return socs;
        }

        public List<Society> GetAllSociety(int socId)
        {
            var socs = _db.TR_SOC_Society.Where(m => m.soc_id == socId).Select(SocietyTranslator.RepositoryToEntity()).OrderBy(m => m.Society_Name).ToList();
            foreach (var item in socs)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "socId");
            }
            return socs;
        }

        /// <summary>
        /// 20230930 更新汇率表
        /// </summary>
        /// <param name="allCurrency"></param>
        public void UpdateCurrency(List<Currencies> allCurrency)
        {
            var now = DateTime.Now;
            var usdCur = allCurrency.FirstOrDefault(l => l.Name == "美元");
            var gbp = allCurrency.FirstOrDefault(l => l.Name == "英镑");
            var euro = allCurrency.FirstOrDefault(l => l.Name == "欧元");
            var roub = allCurrency.FirstOrDefault(l => l.Name == "卢布");
            var hkd = allCurrency.FirstOrDefault(l => l.Name == "港币");
            var mad = allCurrency.FirstOrDefault(l => l.Name == "摩洛哥迪拉姆");

            var curs = _db.TR_CUR_Currency.ToList();
            //以美元为基准 
            var usdBase = curs.FirstOrDefault(l => l.cur_designation == "USD");
            // 更新欧元
            var euroBase = curs.FirstOrDefault(l => l.cur_designation == "EURO");
            // 20240615 用于纠正汇率的倍数，欧元美元之间倍数设定为5倍
            decimal corrigeratemin = (decimal)0.5;
            decimal corrigeratemax = 5;
            var mcu_rate_in = euro.BuyingRate / usdCur.BuyingRate;
            var mcu_rate_out = euro.SellingRate / usdCur.SellingRate;
            if (mcu_rate_in < corrigeratemin || mcu_rate_in > corrigeratemax)
            {
                mcu_rate_in = mcu_rate_in < corrigeratemin ? mcu_rate_in * 10 : mcu_rate_in / 10;
            }
            if (mcu_rate_out < corrigeratemin || mcu_rate_out > corrigeratemax)
            {
                mcu_rate_out = mcu_rate_out < corrigeratemin ? mcu_rate_out * 10 : mcu_rate_out / 10;
            }
            var mainEuro = new TR_MCU_Main_Currency
            {
                cur_id = euroBase.cur_id,
                mcu_rate_in = mcu_rate_in,
                mcu_rate_out = mcu_rate_out,
                lng_id = euroBase.lng_id,
                cur_id2 = usdBase.cur_id,
                mcu_rate_date = now
            };
            _db.TR_MCU_Main_Currency.AddObject(mainEuro);
            // 更新英镑
            corrigeratemin = (decimal)0.5;
            corrigeratemax = 5;
            mcu_rate_in = gbp.BuyingRate / usdCur.BuyingRate;
            mcu_rate_out = gbp.SellingRate / usdCur.SellingRate;
            if (mcu_rate_in < corrigeratemin || mcu_rate_in > corrigeratemax)
            {
                mcu_rate_in = mcu_rate_in < corrigeratemin ? mcu_rate_in * 10 : mcu_rate_in / 10;
            }
            if (mcu_rate_out < corrigeratemin || mcu_rate_out > corrigeratemax)
            {
                mcu_rate_out = mcu_rate_out < corrigeratemin ? mcu_rate_out * 10 : mcu_rate_out / 10;
            }
            var gbpBase = curs.FirstOrDefault(l => l.cur_designation == "GBP");
            var mainGBP = new TR_MCU_Main_Currency
            {
                cur_id = gbpBase.cur_id,
                mcu_rate_in = mcu_rate_in,
                mcu_rate_out = mcu_rate_out,
                lng_id = gbpBase.lng_id,
                cur_id2 = usdBase.cur_id,
                mcu_rate_date = now
            };
            _db.TR_MCU_Main_Currency.AddObject(mainGBP);
            // 更新人民币
            corrigeratemin = (decimal)0.05;
            corrigeratemax = 2;
            mcu_rate_in = 100 / usdCur.BuyingRate;
            mcu_rate_out = 100 / usdCur.SellingRate;
            if (mcu_rate_in < corrigeratemin || mcu_rate_in > corrigeratemax)
            {
                mcu_rate_in = mcu_rate_in < corrigeratemin ? mcu_rate_in * 10 : mcu_rate_in / 10;
            }
            if (mcu_rate_out < corrigeratemin || mcu_rate_out > corrigeratemax)
            {
                mcu_rate_out = mcu_rate_out < corrigeratemin ? mcu_rate_out * 10 : mcu_rate_out / 10;
            }
            // 未能找到原因，强制更新
            if (mcu_rate_in < corrigeratemin)
            {
                mcu_rate_in = mcu_rate_in * 10;
            }
            if (mcu_rate_out < corrigeratemin)
            {
                mcu_rate_out = mcu_rate_out * 10;
            }
            var cnyBase = curs.FirstOrDefault(l => l.cur_designation == "CNY");
            var mainCny = new TR_MCU_Main_Currency
            {
                cur_id = cnyBase.cur_id,
                //// 20231109 这里由于是基于100的基础，需要修正下, 20240615注释掉这里，换成范围取值
                //mcu_rate_in = (100 / usdCur.BuyingRate) < (decimal)0.01 ? (100 * 100 / usdCur.BuyingRate) : (100 / usdCur.BuyingRate),
                //mcu_rate_out = (100 / usdCur.SellingRate) < (decimal)0.01 ? (100 * 100 / usdCur.SellingRate) : (100 / usdCur.SellingRate),
                mcu_rate_in = mcu_rate_in,
                mcu_rate_out = mcu_rate_out,
                lng_id = cnyBase.lng_id,
                cur_id2 = usdBase.cur_id,
                mcu_rate_date = now
            };
            _db.TR_MCU_Main_Currency.AddObject(mainCny);
            // 更新卢布
            corrigeratemin = (decimal)0.002;
            corrigeratemax = 2;
            mcu_rate_in = roub.BuyingRate / usdCur.BuyingRate;
            mcu_rate_out = roub.SellingRate / usdCur.SellingRate;
            if (mcu_rate_in < corrigeratemin || mcu_rate_in > corrigeratemax)
            {
                mcu_rate_in = mcu_rate_in < corrigeratemin ? mcu_rate_in * 10 : mcu_rate_in / 10;
            }
            if (mcu_rate_out < corrigeratemin || mcu_rate_out > corrigeratemax)
            {
                mcu_rate_out = mcu_rate_out < corrigeratemin ? mcu_rate_out * 10 : mcu_rate_out / 10;
            }
            var rbrBase = curs.FirstOrDefault(l => l.cur_designation == "ROUBLE RUSSE");
            var mainRBR = new TR_MCU_Main_Currency
            {
                cur_id = rbrBase.cur_id,
                //mcu_rate_in = roub.BuyingRate / usdCur.BuyingRate,
                //mcu_rate_out = roub.SellingRate / usdCur.SellingRate,
                mcu_rate_in = mcu_rate_in,
                mcu_rate_out = mcu_rate_out,
                lng_id = rbrBase.lng_id,
                cur_id2 = usdBase.cur_id,
                mcu_rate_date = now
            };
            _db.TR_MCU_Main_Currency.AddObject(mainRBR);
            // 更新迪拉姆, 这里更新方式比较特殊！
            var madBase = curs.FirstOrDefault(l => l.cur_designation == "DIRHAMS");
            if (mad != null)
            {
                var mainMad = new TR_MCU_Main_Currency
                    {
                        cur_id = madBase.cur_id,
                        mcu_rate_in = mad.SellingRate,
                        mcu_rate_out = 0,
                        lng_id = madBase.lng_id,
                        cur_id2 = usdBase.cur_id,
                        mcu_rate_date = now
                    };
                _db.TR_MCU_Main_Currency.AddObject(mainMad);
            }
            // 更新港币
            corrigeratemin = (decimal)0.05;
            corrigeratemax = 2;
            mcu_rate_in = hkd.BuyingRate / usdCur.BuyingRate;
            mcu_rate_out = hkd.SellingRate / usdCur.SellingRate;
            if (mcu_rate_in < corrigeratemin || mcu_rate_in > corrigeratemax)
            {
                mcu_rate_in = mcu_rate_in < corrigeratemin ? mcu_rate_in * 10 : mcu_rate_in / 10;
            }
            if (mcu_rate_out < corrigeratemin || mcu_rate_out > corrigeratemax)
            {
                mcu_rate_out = mcu_rate_out < corrigeratemin ? mcu_rate_out * 10 : mcu_rate_out / 10;
            }
            var hkdBase = curs.FirstOrDefault(l => l.cur_designation == "HKD");
            var mainHKD = new TR_MCU_Main_Currency
            {
                cur_id = hkdBase.cur_id,
                //mcu_rate_in = hkd.BuyingRate / usdCur.BuyingRate,
                //mcu_rate_out = hkd.SellingRate / usdCur.SellingRate,
                mcu_rate_in = mcu_rate_in,
                mcu_rate_out = mcu_rate_out,
                lng_id = hkdBase.lng_id,
                cur_id2 = usdBase.cur_id,
                mcu_rate_date = now
            };
            _db.TR_MCU_Main_Currency.AddObject(mainHKD);
            _db.SaveChanges();
        }

        public List<Currencies> GetCurrency(int socId)
        {
            var listres = new List<Currencies>();
            var aSociety = _db.TR_SOC_Society.FirstOrDefault(m => m.soc_id == socId);
            var mainCur = _db.TR_MCU_Main_Currency.OrderByDescending(l => l.mcu_rate_date).FirstOrDefault();
            if (mainCur != null && aSociety != null)
            {
                listres =
                    _db.TR_MCU_Main_Currency.Where(l => l.mcu_rate_date == mainCur.mcu_rate_date)
                        .Select(l => new Currencies
                        {
                            Name = l.TR_CUR_Currency.cur_designation,
                            SellingRate = l.mcu_rate_in,
                            UpdateTime = l.mcu_rate_date
                        }).ToList();
            }
            return listres;
        }
    }
}
