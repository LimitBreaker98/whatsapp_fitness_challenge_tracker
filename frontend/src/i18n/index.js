import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import enCommon from './locales/en/common.json';
import enLeaderboard from './locales/en/leaderboard.json';
import enFunStats from './locales/en/funStats.json';
import enProgressChart from './locales/en/progressChart.json';
import enAdmin from './locales/en/admin.json';
import enRules from './locales/en/rules.json';
import enHistoricChallenges from './locales/en/historicChallenges.json';
import enVoting from './locales/en/voting.json';
import enVotings from './locales/en/votings.json';

import esCommon from './locales/es/common.json';
import esLeaderboard from './locales/es/leaderboard.json';
import esFunStats from './locales/es/funStats.json';
import esProgressChart from './locales/es/progressChart.json';
import esAdmin from './locales/es/admin.json';
import esRules from './locales/es/rules.json';
import esHistoricChallenges from './locales/es/historicChallenges.json';
import esVoting from './locales/es/voting.json';
import esVotings from './locales/es/votings.json';

const resources = {
  en: {
    common: enCommon,
    leaderboard: enLeaderboard,
    funStats: enFunStats,
    progressChart: enProgressChart,
    admin: enAdmin,
    rules: enRules,
    historicChallenges: enHistoricChallenges,
    voting: enVoting,
    votings: enVotings,
  },
  es: {
    common: esCommon,
    leaderboard: esLeaderboard,
    funStats: esFunStats,
    progressChart: esProgressChart,
    admin: esAdmin,
    rules: esRules,
    historicChallenges: esHistoricChallenges,
    voting: esVoting,
    votings: esVotings,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
