import { useTranslation } from 'react-i18next';
import chartImage from '../assets/first-challenge.jpeg';
import './HistoricChallenges.css';

const finalScores = [
  { name: 'Josh', score: 117 },
  { name: 'Pocho', score: 111 },
  { name: 'Pepo', score: 110 },
  { name: 'Mene', score: 107 },
];

export default function HistoricChallenges() {
  const { t } = useTranslation('historicChallenges');

  return (
    <section className="historic-challenges">
      <div className="historic-card">
        <header className="historic-header">
          <h2>{t('title')}</h2>
          <p>{t('subtitle')}</p>
        </header>

        <div className="historic-content">
          <div className="historic-chart">
            <img src={chartImage} alt={t('chartAlt')} />
            <p className="historic-caption">{t('chartCaption')}</p>
          </div>

          <div className="historic-scores">
            <h3>{t('finalScores')}</h3>
            <ul>
              {finalScores.map((player, index) => (
                <li key={player.name} className={`historic-row rank-${index + 1}`}>
                  <span className="historic-rank">#{index + 1}</span>
                  <span className="player-name">{player.name}</span>
                  <span className="player-score">{player.score}</span>
                </li>
              ))}
            </ul>
            <p className="historic-note">{t('dateNote')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
