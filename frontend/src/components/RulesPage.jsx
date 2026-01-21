import { useTranslation } from 'react-i18next';
import './RulesPage.css';

export default function RulesPage() {
  const { t } = useTranslation('rules');

  return (
    <div className="rules-page">
      <h2>{t('title')}</h2>
      <p className="rules-subtitle">{t('subtitle')}</p>

      <section className="rules-section purpose-section">
        <div className="section-icon">🎯</div>
        <div className="section-content">
          <h3>{t('purpose.title')}</h3>
          <p>{t('purpose.description')}</p>
          <p className="highlight">{t('purpose.highlight')}</p>
        </div>
      </section>

      <section className="rules-section duration-section">
        <div className="section-icon">📅</div>
        <div className="section-content">
          <h3>{t('duration.title')}</h3>
          <div className="date-range">
            <div className="date-item">
              <span className="date-label">{t('duration.start')}</span>
              <span className="date-value">{t('duration.startDate')}</span>
            </div>
            <div className="date-item">
              <span className="date-label">{t('duration.end')}</span>
              <span className="date-value">{t('duration.endDate')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rules-section general-section">
        <div className="section-icon">📋</div>
        <div className="section-content">
          <h3>{t('general.title')}</h3>
          <ul>
            {t('general.rules', { returnObjects: true }).map((rule, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: rule }} />
            ))}
          </ul>
        </div>
      </section>

      <section className="rules-section exercises-section">
        <div className="section-icon">🏃</div>
        <div className="section-content">
          <h3>{t('exercises.title')}</h3>

          <div className="exercise-category">
            <h4>{t('exercises.running.title')}</h4>
            <ul>
              {t('exercises.running.rules', { returnObjects: true }).map((rule, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: rule }} />
              ))}
            </ul>
            <p className="note">{t('exercises.running.note')}</p>
          </div>

          <div className="exercise-category">
            <h4>{t('exercises.strength.title')}</h4>
            <p dangerouslySetInnerHTML={{ __html: t('exercises.strength.description') }} />
            <ul>
              {t('exercises.strength.types', { returnObjects: true }).map((type, i) => (
                <li key={i}>{type}</li>
              ))}
            </ul>
            <p className="note">{t('exercises.strength.note')}</p>
          </div>

          <div className="exercise-category">
            <h4>{t('exercises.cardio.title')}</h4>
            <p dangerouslySetInnerHTML={{ __html: t('exercises.cardio.description') }} />
            <ul>
              {t('exercises.cardio.conditions', { returnObjects: true }).map((condition, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: condition }} />
              ))}
            </ul>
            <p className="examples">{t('exercises.cardio.examples')}</p>
            <p className="note">{t('exercises.cardio.note')}</p>
          </div>
        </div>
      </section>

      <section className="rules-section evidence-section">
        <div className="section-icon">📸</div>
        <div className="section-content">
          <h3>{t('evidence.title')}</h3>
          <p>{t('evidence.description')}</p>
          <ul>
            {t('evidence.types', { returnObjects: true }).map((type, i) => (
              <li key={i}>{type}</li>
            ))}
          </ul>
          <p className="note">{t('evidence.note')}</p>
        </div>
      </section>

      <section className="rules-section prizes-section">
        <div className="section-icon">💰</div>
        <div className="section-content">
          <h3>{t('prizes.title')}</h3>
          <p dangerouslySetInnerHTML={{ __html: t('prizes.entryFee') }} />
          <p>{t('prizes.distribution')}</p>
          <div className="prize-list">
            <div className="prize-item gold">
              <span className="place">{t('prizes.places.first')}</span>
              <span className="percent">50%</span>
            </div>
            <div className="prize-item silver">
              <span className="place">{t('prizes.places.second')}</span>
              <span className="percent">35%</span>
            </div>
            <div className="prize-item bronze">
              <span className="place">{t('prizes.places.third')}</span>
              <span className="percent">10%</span>
            </div>
            <div className="prize-item">
              <span className="place">{t('prizes.places.fourth')}</span>
              <span className="percent">5%</span>
            </div>
            <div className="prize-item">
              <span className="place">{t('prizes.places.fifth')}</span>
              <span className="percent">0%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rules-section spirit-section">
        <div className="section-icon">💪</div>
        <div className="section-content">
          <h3>{t('spirit.title')}</h3>
          <p>{t('spirit.intro')}</p>
          <ul className="spirit-list">
            {t('spirit.values', { returnObjects: true }).map((value, i) => (
              <li key={i}>{value}</li>
            ))}
          </ul>
          <p className="highlight">{t('spirit.highlight')}</p>
        </div>
      </section>
    </div>
  );
}
