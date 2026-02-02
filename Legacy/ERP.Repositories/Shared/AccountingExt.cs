using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace ERP.Repositories.Shared
{
    public static class AccountingExt
    {
        private static Regex regex_rib;
        /// <summary>
        /// Vérifie la validité d'un RIB
        /// </summary>
        /// <param name="rib">Le RIB à vérifier</param>
        /// <returns>true si le RIB est valide, false sinon</returns>
        public static bool IsValidRib(string rib)
        {
            // Suppression des espaces et tirets
            string tmp = rib.Replace(" ", "").Replace("-", "");
            // Vérification du format BBBBBGGGGGCCCCCCCCCCCKK
            // B : banque
            // G : guichet
            // C : numéro de compte
            // K : clé RIB
            if (regex_rib == null)
            {
                regex_rib = new Regex(@"(?<B>\d{5})(?<G>\d{5})(?<C>\w{11})(?<K>\d{2})", RegexOptions.Compiled);
            }
            Match m = regex_rib.Match(tmp);
            if (!m.Success)
                return false;

            // Extraction des composants
            string b_s = m.Groups["B"].Value;
            string g_s = m.Groups["G"].Value;
            string c_s = m.Groups["C"].Value;
            string k_s = m.Groups["K"].Value;

            // Remplacement des lettres par des chiffres dans le numéro de compte
            StringBuilder sb = new StringBuilder();
            foreach (char ch in c_s.ToUpper())
            {
                if (char.IsDigit(ch))
                    sb.Append(ch);
                else
                    sb.Append(RibLetterToDigit(ch));
            }
            c_s = sb.ToString();

            // Séparation du numéro de compte pour tenir sur 32bits
            string d_s = c_s.Substring(0, 6);
            c_s = c_s.Substring(6, 5);

            // Calcul de la clé RIB
            // Algo ici : http://fr.wikipedia.org/wiki/Clé_RIB#Algorithme_de_calcul_qui_fonctionne_avec_des_entiers_32_bits

            int b = int.Parse(b_s);
            int g = int.Parse(g_s);
            int d = int.Parse(d_s);
            int c = int.Parse(c_s);
            int k = int.Parse(k_s);

            int calculatedKey = 97 - ((89 * b + 15 * g + 76 * d + 3 * c) % 97);

            return (k == calculatedKey);
        }
        /// <summary>
        /// Convertit une lettre d'un RIB en un chiffre selon la table suivante :
        /// 1 2 3 4 5 6 7 8 9
        /// A B C D E F G H I
        /// J K L M N O P Q R
        /// _ S T U V W X Y Z
        /// </summary>
        /// <param name="c">La lettre à convertir</param>
        /// <returns>Le chiffre de remplacement</returns>
        public static char RibLetterToDigit(char letter)
        {
            if (letter >= 'A' && letter <= 'I')
            {
                return (char)(letter - 'A' + '1');
            }
            else if (letter >= 'J' && letter <= 'R')
            {
                return (char)(letter - 'J' + '1');
            }
            else if (letter >= 'S' && letter <= 'Z')
            {
                return (char)(letter - 'S' + '2');
            }
            else
                throw new ArgumentOutOfRangeException("Le caractère à convertir doit être une lettre majuscule dans la plage A-Z");
        }

        public static String GetIbanFromRib(string codebanque, string codeGuichet, string numerocompte, string cle)
        {
            String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            String tmp = codebanque + codeGuichet + numerocompte + cle + "FR00";
            tmp = tmp.ToUpper();
            foreach (char c in tmp.ToCharArray())
            {
                if (char.IsLetter(c))
                {
                    tmp = tmp.Replace(c.ToString(), (alphabet.IndexOf(c) + 10).ToString());
                }
            }
            var moduloRemainder = System.Numerics.BigInteger.Parse(tmp) % 97;
            String ibanKey = (98 - moduloRemainder).ToString();
            if (ibanKey.Length == 1)
            {
                ibanKey = "0" + ibanKey;
            }
            return "FR" + ibanKey + codebanque + codeGuichet + numerocompte + cle;
        }

    }
}
