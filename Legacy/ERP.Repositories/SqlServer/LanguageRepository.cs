using System;
using System.Collections.Generic;
using System.Linq;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class LanguageRepository : BaseSqlServerRepository
    {
        #region Language CRUD Operations

        /// <summary>
        /// Creates or updates a language record
        /// </summary>
        /// <param name="oneLanguage">Language entity to create or update</param>
        /// <returns>The ID of the created/updated language</returns>
        public int CreateUpdateLanguage(Language oneLanguage)
        {
            int _id = 0;
            bool create = false;
            if (oneLanguage.Id != 0)
            {
                var existing = _db.TR_LAN_Language.FirstOrDefault(m => m.lan_id == oneLanguage.Id);
                if (existing != null)
                {
                    existing = LanguageTranslator.EntityToRepository(oneLanguage, existing);
                    _db.TR_LAN_Language.ApplyCurrentValues(existing);
                    _db.SaveChanges();
                    _id = existing.lan_id;
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
                var newLanguage = new TR_LAN_Language();
                newLanguage = LanguageTranslator.EntityToRepository(oneLanguage, newLanguage, true);
                _db.TR_LAN_Language.AddObject(newLanguage);
                _db.SaveChanges();
                _id = newLanguage.lan_id;
            }
            return _id;
        }

        /// <summary>
        /// Loads a language by its ID
        /// </summary>
        /// <param name="lanId">Language ID</param>
        /// <returns>Language entity or null if not found</returns>
        public Language LoadLanguageById(int lanId)
        {
            var aLanguage = _db.TR_LAN_Language
                .Where(m => m.lan_id == lanId)
                .Select(LanguageTranslator.RepositoryToEntity())
                .FirstOrDefault();
            if (aLanguage != null)
            {
                aLanguage.FId = StringCipher.EncoderSimple(aLanguage.Id.ToString(), "lanId");
            }
            return aLanguage;
        }

        /// <summary>
        /// Loads all languages
        /// </summary>
        /// <returns>List of all language entities</returns>
        public List<Language> LoadAllLanguages()
        {
            var languages = _db.TR_LAN_Language
                .Select(LanguageTranslator.RepositoryToEntity())
                .OrderBy(m => m.Label)
                .ToList();
            foreach (var item in languages)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "lanId");
            }
            return languages;
        }

        /// <summary>
        /// Gets all languages as KeyValue pairs for dropdowns
        /// </summary>
        /// <returns>List of KeyValue pairs with language data</returns>
        public List<KeyValue> GetAllLanguageKeyValues()
        {
            var result = new List<KeyValue>();
            try
            {
                result = _db.TR_LAN_Language.Select(m => new KeyValue
                {
                    Key = m.lan_id,
                    Value = m.lan_label,
                    Value2 = m.lan_short_label
                }).OrderBy(m => m.Value).ToList();
            }
            catch (Exception)
            {
            }
            return result;
        }

        /// <summary>
        /// Deletes a language by ID
        /// </summary>
        /// <param name="lanId">Language ID to delete</param>
        /// <returns>True if deleted successfully, false otherwise</returns>
        public bool DeleteLanguage(int lanId)
        {
            bool deleted = false;
            var language = _db.TR_LAN_Language.FirstOrDefault(m => m.lan_id == lanId);
            if (language != null)
            {
                try
                {
                    _db.TR_LAN_Language.DeleteObject(language);
                    _db.SaveChanges();
                    deleted = true;
                }
                catch (Exception)
                {
                }
            }
            return deleted;
        }

        #endregion Language CRUD Operations
    }
}
