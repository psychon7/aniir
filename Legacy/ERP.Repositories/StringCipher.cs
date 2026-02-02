using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Security;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using ERP.Repositories.SqlServer;

namespace ERP.Repositories
{
    public static class StringCipher
    {
        // This constant is used to determine the keysize of the encryption algorithm in bits.
        // We divide this by 8 within the code below to get the equivalent number of bytes.
        private const int Keysize = 256;

        // This constant determines the number of iterations for the password bytes generation function.
        private const int DerivationIterations = 1000;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="plainText">密码</param>
        /// <param name="passPhrase">Login</param>
        /// <returns></returns>
        public static string Encrypt(string plainText, string passPhrase)
        {
            // Salt and IV is randomly generated each time, but is preprended to encrypted cipher text
            // so that the same Salt and IV values can be used when decrypting.  
            var saltStringBytes = Generate256BitsOfRandomEntropy();
            var ivStringBytes = Generate256BitsOfRandomEntropy();
            var plainTextBytes = Encoding.UTF8.GetBytes(plainText);
            using (var password = new Rfc2898DeriveBytes(passPhrase, saltStringBytes, DerivationIterations))
            {
                var keyBytes = password.GetBytes(Keysize / 8);
                using (var symmetricKey = new RijndaelManaged())
                {
                    symmetricKey.BlockSize = 256;
                    symmetricKey.Mode = CipherMode.CBC;
                    symmetricKey.Padding = PaddingMode.PKCS7;
                    using (var encryptor = symmetricKey.CreateEncryptor(keyBytes, ivStringBytes))
                    {
                        using (var memoryStream = new MemoryStream())
                        {
                            using (var cryptoStream = new CryptoStream(memoryStream, encryptor, CryptoStreamMode.Write))
                            {
                                cryptoStream.Write(plainTextBytes, 0, plainTextBytes.Length);
                                cryptoStream.FlushFinalBlock();
                                // Create the final bytes as a concatenation of the random salt bytes, the random iv bytes and the cipher bytes.
                                var cipherTextBytes = saltStringBytes;
                                cipherTextBytes = cipherTextBytes.Concat(ivStringBytes).ToArray();
                                cipherTextBytes = cipherTextBytes.Concat(memoryStream.ToArray()).ToArray();
                                memoryStream.Close();
                                cryptoStream.Close();
                                return Convert.ToBase64String(cipherTextBytes);
                            }
                        }
                    }
                }
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="cipherText">密码</param>
        /// <param name="passPhrase">Login</param>
        /// <returns></returns>
        public static string Decrypt(string cipherText, string passPhrase)
        {
            // Get the complete stream of bytes that represent:
            // [32 bytes of Salt] + [32 bytes of IV] + [n bytes of CipherText]
            var cipherTextBytesWithSaltAndIv = Convert.FromBase64String(cipherText);
            // Get the saltbytes by extracting the first 32 bytes from the supplied cipherText bytes.
            var saltStringBytes = cipherTextBytesWithSaltAndIv.Take(Keysize / 8).ToArray();
            // Get the IV bytes by extracting the next 32 bytes from the supplied cipherText bytes.
            var ivStringBytes = cipherTextBytesWithSaltAndIv.Skip(Keysize / 8).Take(Keysize / 8).ToArray();
            // Get the actual cipher text bytes by removing the first 64 bytes from the cipherText string.
            var cipherTextBytes = cipherTextBytesWithSaltAndIv.Skip((Keysize / 8) * 2).Take(cipherTextBytesWithSaltAndIv.Length - ((Keysize / 8) * 2)).ToArray();

            using (var password = new Rfc2898DeriveBytes(passPhrase, saltStringBytes, DerivationIterations))
            {
                var keyBytes = password.GetBytes(Keysize / 8);
                using (var symmetricKey = new RijndaelManaged())
                {
                    symmetricKey.BlockSize = 256;
                    symmetricKey.Mode = CipherMode.CBC;
                    symmetricKey.Padding = PaddingMode.PKCS7;
                    using (var decryptor = symmetricKey.CreateDecryptor(keyBytes, ivStringBytes))
                    {
                        using (var memoryStream = new MemoryStream(cipherTextBytes))
                        {
                            using (var cryptoStream = new CryptoStream(memoryStream, decryptor, CryptoStreamMode.Read))
                            {
                                var plainTextBytes = new byte[cipherTextBytes.Length];
                                var decryptedByteCount = cryptoStream.Read(plainTextBytes, 0, plainTextBytes.Length);
                                memoryStream.Close();
                                cryptoStream.Close();
                                return Encoding.UTF8.GetString(plainTextBytes, 0, decryptedByteCount);
                            }
                        }
                    }
                }
            }
        }

        private static byte[] Generate256BitsOfRandomEntropy()
        {
            var randomBytes = new byte[32]; // 32 Bytes will give us 256 bits.
            using (var rngCsp = new RNGCryptoServiceProvider())
            {
                // Fill the array with cryptographically secure random bytes.
                rngCsp.GetBytes(randomBytes);
            }
            return randomBytes;
        }


        /// <summary>  
        /// 对称加密  
        /// </summary>  
        /// <param name="sendStr"></param>  
        /// <returns></returns>  
        public static string EncoderSimple(string sendStr, string key)
        {
            string keyWord = strToToHexByte(key);
            keyWord = keyWord.StringFilled(16);
            //if (keyWord.Length < 16)
            //{
            //    keyWord = string.Format("{0:d16}", keyWord);
            //}
            DESEncrypt desc = new DESEncrypt();
            byte[] data = desc.Encrypt(sendStr, keyWord);
            string result = Convert.ToBase64String(data);
            result = result.Replace("=", ",");
            result = result.Replace("+", ";");
            result = result.Replace("/", "|");
            return result;
        }

        /// <summary>  
        /// 对称解密  
        /// </summary>  
        /// <param name="recStr"></param>  
        /// <returns></returns>  
        public static string DecoderSimple(string recStr, string key)
        {
            if (!string.IsNullOrEmpty(recStr) && (recStr.Contains("%") || recStr.Contains("#")))
            {
                //recStr = HttpUtility.UrlDecode(recStr);
                recStr = WebUtility.HtmlDecode(recStr);
            }
            try
            {
                string keyWord = strToToHexByte(key);
                keyWord = keyWord.StringFilled(16);
                DESEncrypt desc = new DESEncrypt();
                //将base64字符串转换成二进制BTYE数组  
                recStr = recStr.Replace(",", "=");
                recStr = recStr.Replace(";", "+");
                recStr = recStr.Replace("|", "/");
                byte[] recData = Convert.FromBase64String(recStr);
                recStr = desc.Decrypt(recData, keyWord);
            }
            catch (Exception)
            {

            }
            return recStr;
        }

        /// <summary>
        /// 将字符串按长度补齐
        /// </summary>
        /// <param name="resource"></param>
        /// <param name="length"></param>
        /// <returns></returns>
        public static string StringFilled(this string resource, int length)
        {
            if (!string.IsNullOrEmpty(resource) && resource.Length < length)
            {
                int length2add = length - resource.Length;
                for (int i = 0; i < length2add; i++)
                {
                    resource = string.Format("0{0}", resource);
                }
            }
            return resource;
        }

        /// <summary>
        /// 字符串转16进制字节数组
        /// </summary>
        /// <param name="hexString"></param>
        /// <returns></returns>
        private static string strToToHexByte(string input)
        {
            string returnstring = string.Empty;
            char[] values = input.ToCharArray();
            return values.Select(letter => Convert.ToInt32(letter)).Aggregate(returnstring, (current, value) => current + String.Format("{0:X}", value));
        }
    }
    class DESEncrypt
    {
        static DESEncrypt()
        {

        }
        /// <summary>  
        /// 加密(DES-ECB PKCS#7)  
        /// </summary>  
        /// <param name="pToEncrypt">待加密的明文</param>  
        /// <param name="sKey">16位16进制的字符串</param>  
        /// <returns>返回加密后的字节流</returns>  
        public byte[] Encrypt(string pToEncrypt, string sKey)
        {
            byte[] desByte = null;
            try
            {
                DESCryptoServiceProvider des = new DESCryptoServiceProvider();
                byte[] inputByteArray = System.Text.Encoding.UTF8.GetBytes(pToEncrypt);
                des.Key = GetKey(sKey);
                des.Mode = CipherMode.ECB;
                des.Padding = PaddingMode.PKCS7;
                desByte = des.CreateEncryptor().TransformFinalBlock(inputByteArray, 0, inputByteArray.Length);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.WriteLine(ex.ToString());
            }
            return desByte;
        }
        /// <summary>  
        ///解密(DES-ECB PKCS#7)  
        /// </summary>  
        /// <param name="bodyByte">待解密的字节流</param>  
        /// <param name="sKey">16位16进制的字符串</param>  
        /// <returns>返回解密的字符串</returns>  
        public string Decrypt(byte[] bodyByte, string sKey)
        {
            string bodyStr = string.Empty;
            try
            {
                DESCryptoServiceProvider des = new DESCryptoServiceProvider();
                des.Mode = CipherMode.ECB;
                des.Padding = PaddingMode.PKCS7;
                des.Key = GetKey(sKey);
                bodyStr = System.Text.Encoding.UTF8.GetString(des.CreateDecryptor().TransformFinalBlock(bodyByte, 0, bodyByte.Length));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.WriteLine(ex.ToString());
            }
            return bodyStr;
        }

        private byte[] GetKey(string sKey)
        {

            byte[] _key = new byte[8];
            try
            {
                ArrayList array = new ArrayList();
                Char[] sKeyChar = sKey.ToCharArray();
                for (int i = 0; i < sKeyChar.Length; i = i + 2)
                {
                    string str = string.Empty;
                    for (int j = i; j < i + 2; j++)
                    {
                        str += sKeyChar[j];
                    }
                    array.Add(str);
                }

                for (int i = 0; i < array.Count; i++)
                {
                    _key[i] = byte.Parse(array[i].ToString(), System.Globalization.NumberStyles.AllowHexSpecifier);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.WriteLine(ex.ToString());
            }
            return _key;
        }
    }

}
