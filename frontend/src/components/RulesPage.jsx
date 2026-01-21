import './RulesPage.css';

export default function RulesPage() {
  return (
    <div className="rules-page">
      <h2>Challenge Rules</h2>
      <p className="rules-subtitle">Friendly Exercise Challenge 2026</p>

      <section className="rules-section purpose-section">
        <div className="section-icon">🎯</div>
        <div className="section-content">
          <h3>Purpose</h3>
          <p>
            A friendly exercise challenge among friends designed to promote healthy and consistent
            physical activity, strengthen connections across borders (this is an international challenge!),
            and nurture friendship throughout the process.
          </p>
          <p className="highlight">
            The main goal is not just to compete, but to maintain discipline, health, and consistency,
            supported by a spirit of mutual encouragement.
          </p>
        </div>
      </section>

      <section className="rules-section duration-section">
        <div className="section-icon">📅</div>
        <div className="section-content">
          <h3>Duration</h3>
          <div className="date-range">
            <div className="date-item">
              <span className="date-label">Start</span>
              <span className="date-value">Monday, January 19, 2026</span>
            </div>
            <div className="date-item">
              <span className="date-label">End</span>
              <span className="date-value">Wednesday, June 10, 2026</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rules-section general-section">
        <div className="section-icon">📋</div>
        <div className="section-content">
          <h3>General Rules</h3>
          <ul>
            <li>Each valid exercise session equals <strong>1 point</strong></li>
            <li>Only <strong>1 point per day</strong> maximum (with exceptions below)</li>
            <li>The challenge is based on <strong>honesty, good faith, and personal responsibility</strong></li>
            <li>Evidence of exercise is required for points to count</li>
          </ul>
        </div>
      </section>

      <section className="rules-section exercises-section">
        <div className="section-icon">🏃</div>
        <div className="section-content">
          <h3>Valid Exercise Types</h3>

          <div className="exercise-category">
            <h4>Running / Jogging</h4>
            <ul>
              <li>Minimum <strong>5 km</strong> = 1 point</li>
              <li><strong>21.1 km</strong> (Half Marathon) = 2 points</li>
              <li><strong>42.2 km</strong> (Marathon) = 4 points</li>
            </ul>
            <p className="note">Bonus points only apply for these specific distances.</p>
          </div>

          <div className="exercise-category">
            <h4>Strength Training</h4>
            <p>Sessions that include at least <strong>4 different strength exercises</strong>:</p>
            <ul>
              <li>Weight lifting</li>
              <li>Calisthenics</li>
              <li>Functional training</li>
              <li>Resistance bands or machines</li>
            </ul>
            <p className="note">Each valid session = 1 point</p>
          </div>

          <div className="exercise-category">
            <h4>Other Cardio / Intense Exercise</h4>
            <p>Any exercise meeting <strong>ALL</strong> of these conditions:</p>
            <ul>
              <li>Minimum <strong>30 minutes</strong> duration</li>
              <li>Average heart rate of <strong>120+ bpm</strong></li>
              <li>Sustained physical effort</li>
            </ul>
            <p className="examples">Examples: Cycling, Swimming, Elliptical, Group classes (Spinning, HIIT), Skiing</p>
            <p className="note">Each valid session = 1 point</p>
          </div>
        </div>
      </section>

      <section className="rules-section evidence-section">
        <div className="section-icon">📸</div>
        <div className="section-content">
          <h3>Evidence Requirements</h3>
          <p>For a session to be valid, you must submit proof:</p>
          <ul>
            <li>Photo of yourself exercising, OR</li>
            <li>Activity log from apps/devices (Strava, Apple Watch, Garmin, etc.)</li>
          </ul>
          <p className="note">Evidence must be clear and correspond to the exercise day.</p>
        </div>
      </section>

      <section className="rules-section prizes-section">
        <div className="section-icon">💰</div>
        <div className="section-content">
          <h3>Entry Fee &amp; Prizes</h3>
          <p>Each participant contributes <strong>$20 USD</strong>.</p>
          <p>Prize distribution:</p>
          <div className="prize-list">
            <div className="prize-item gold">
              <span className="place">1st</span>
              <span className="percent">50%</span>
            </div>
            <div className="prize-item silver">
              <span className="place">2nd</span>
              <span className="percent">35%</span>
            </div>
            <div className="prize-item bronze">
              <span className="place">3rd</span>
              <span className="percent">10%</span>
            </div>
            <div className="prize-item">
              <span className="place">4th</span>
              <span className="percent">5%</span>
            </div>
            <div className="prize-item">
              <span className="place">5th</span>
              <span className="percent">0%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rules-section spirit-section">
        <div className="section-icon">💪</div>
        <div className="section-content">
          <h3>Spirit of the Challenge</h3>
          <p>This challenge is NOT about negative pressure or destructive competition. Its essence is:</p>
          <ul className="spirit-list">
            <li>Consistency</li>
            <li>Self-discipline</li>
            <li>Physical and mental health</li>
            <li>Support among friends</li>
            <li>Celebrating sustained effort over time</li>
          </ul>
          <p className="highlight">
            Any situation not covered by these rules will be resolved by group agreement,
            always prioritizing respect, honesty, and friendship.
          </p>
        </div>
      </section>
    </div>
  );
}
