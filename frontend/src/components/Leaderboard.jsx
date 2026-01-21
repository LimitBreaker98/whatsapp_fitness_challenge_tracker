import { useState, useEffect } from 'react';
import { fetchLatest, fetchScores } from '../api';
import './Leaderboard.css';

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [maxScore, setMaxScore] = useState(0);
  const [newPlayers, setNewPlayers] = useState(new Set());
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

        // Find new players (only appear in the latest entry)
        const entries = allScores.entries;
        const newPlayerSet = new Set();
        if (entries.length >= 1) {
          const latestPlayers = Object.keys(entries[entries.length - 1].scores);
          const previousPlayers = new Set(
            entries.slice(0, -1).flatMap((e) => Object.keys(e.scores))
          );
          for (const player of latestPlayers) {
            if (!previousPlayers.has(player)) {
              newPlayerSet.add(player);
            }
          }
        }

        setData(latest);
        setMaxScore(max);
        setNewPlayers(newPlayerSet);
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

  // Calculate ranks with ties (same score = same rank, then skip)
  const ranks = [];
  let currentRank = 1;
  for (let i = 0; i < sortedPlayers.length; i++) {
    if (i > 0 && sortedPlayers[i][1] < sortedPlayers[i - 1][1]) {
      currentRank = i + 1; // Skip ranks for ties
    }
    ranks.push(currentRank);
  }

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <p className="date">Last update: {data.date}</p>

      <div className="players">
        {sortedPlayers.map(([name, score], index) => {
          const dailyGain = data.daily_gains[name] || 0;
          const gainWidth = (dailyGain / maxScore) * 100;
          const rank = ranks[index];
          const isNewPlayer = newPlayers.has(name);

          return (
            <div key={name} className={`player-row rank-${rank}`}>
              <div className="rank">#{rank}</div>
              <div className="name">{name}</div>
              <div className="score">{score}</div>
              {dailyGain > 0 ? (
                <div className="bar-container">
                  <div
                    className="bar-gain"
                    style={{ width: `${gainWidth}%` }}
                  />
                </div>
              ) : (
                <div className="bar-placeholder" />
              )}
              {isNewPlayer ? (
                <span className="welcome-badge">Welcome {name}!</span>
              ) : dailyGain > 0 ? (
                <span className="gain-badge">+{dailyGain}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
