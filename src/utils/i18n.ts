import en from "@i18n/en.json";
import fr from "@i18n/fr.json";

const translations = { en, fr };

export function useTranslations(lang: string | undefined) {
  const currentLang = (lang === 'fr' ? 'fr' : 'en') as keyof typeof translations;
  
  return function t(key: keyof typeof en) {
    return translations[currentLang][key] || translations.en[key];
  };
}