import { useState, useEffect } from 'react';
import { fetchLatest, fetchScores } from '../api';
import './Leaderboard.css';

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [maxScore, setMaxScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [latest, allScores] = await Promise.all([
          fetchLatest(),
          fetchScores(),
        ]);

        // Calculate max possible score (for progress bar scaling)
        const allScoreValues = allScores.entries.flatMap((e) =>
          Object.values(e.scores)
        );
        const max = Math.max(...allScoreValues, 1);

        setData(latest);
        setMaxScore(max);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <div className="leaderboard">Loading...</div>;
  if (error) return <div className="leaderboard error">Error: {error}</div>;
  if (!data || !data.date) {
    return <div className="leaderboard empty">No data yet</div>;
  }

  // Sort players by score descending
  const sortedPlayers = Object.entries(data.scores).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <p className="date">Last update: {data.date}</p>

      <div className="players">
        {sortedPlayers.map(([name, score], index) => {
          const dailyGain = data.daily_gains[name] || 0;
          const baseWidth = ((score - dailyGain) / maxScore) * 100;
          const gainWidth = (dailyGain / maxScore) * 100;

          return (
            <div key={name} className="player-row">
              <div className="rank">#{index + 1}</div>
              <div className="name">{name}</div>
              <div className="score">{score}</div>
              <div className="bar-container">
                <div
                  className="bar-base"
                  style={{ width: `${baseWidth}%` }}
                />
                {dailyGain > 0 && (
                  <div
                    className="bar-gain"
                    style={{
                      left: `${baseWidth}%`,
                      width: `${gainWidth}%`,
                    }}
                  />
                )}
              </div>
              {dailyGain > 0 && <span className="gain-badge">+{dailyGain}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
