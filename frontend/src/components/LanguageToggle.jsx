import { useTranslation } from 'react-i18next';
import './LanguageToggle.css';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const currentLang = i18n.language.startsWith('es') ? 'ES' : 'EN';

  return (
    <button className="language-toggle" onClick={toggleLanguage}>
      {currentLang}
    </button>
  );
}
