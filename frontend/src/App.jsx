import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Leaderboard from './components/Leaderboard';
import FunStats from './components/FunStats';
import ProgressChart from './components/ProgressChart';
import AdminPage from './components/AdminPage';
import RulesPage from './components/RulesPage';
import HistoricChallenges from './components/HistoricChallenges';
import LanguageToggle from './components/LanguageToggle';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function Dashboard() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  return (
    <div className="dashboard">
      <Leaderboard selectedPlayer={selectedPlayer} onSelectPlayer={setSelectedPlayer} />
      <ProgressChart selectedPlayer={selectedPlayer} onSelectPlayer={setSelectedPlayer} />
      <FunStats />
    </div>
  );
}

function App() {
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <div className="app">
        <header>
          <h1>{t('title')}</h1>
          <nav>
            <Link to="/">{t('nav.dashboard')}</Link>
            <Link to="/rules">{t('nav.rules')}</Link>
            <Link to="/historic">{t('nav.historic')}</Link>
            <Link to="/admin">{t('nav.admin')}</Link>
            <LanguageToggle />
            <ThemeToggle />
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/historic" element={<HistoricChallenges />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
