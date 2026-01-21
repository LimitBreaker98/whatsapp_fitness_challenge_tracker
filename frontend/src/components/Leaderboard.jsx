import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchLatest, fetchScores } from '../api';
import './Leaderboard.css';

// Calculate streak (consecutive days with gains > 0)
function calculateStreaks(entries) {
  const streaks = {};
  if (entries.length === 0) return streaks;

  // Get all players from latest entry
  const latestEntry = entries[entries.length - 1];
  const players = Object.keys(latestEntry.scores);

  for (const player of players) {
    let streak = 0;
    // Go backwards through entries, computing gains by comparing to previous entry
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      const currentScore = entry.scores[player];
      const prevScore = i > 0 ? entries[i - 1].scores[player] : undefined;

      // Calculate gain: current - previous (or 0 if no previous entry for this player)
      const gain = prevScore !== undefined ? currentScore - prevScore : 0;

      if (gain > 0) {
        streak++;
      } else {
        break;
      }
    }
    streaks[player] = streak;
  }
  return streaks;
}

export default function Leaderboard() {
  const { t } = useTranslation('leaderboard');
  const { t: tCommon } = useTranslation('common');
  const [data, setData] = useState(null);
  const [maxScore, setMaxScore] = useState(0);
  const [newPlayers, setNewPlayers] = useState(new Set());
  const [streaks, setStreaks] = useState({});
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

        // Calculate streaks
        const playerStreaks = calculateStreaks(entries);

        setData(latest);
        setMaxScore(max);
        setNewPlayers(newPlayerSet);
        setStreaks(playerStreaks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <div className="leaderboard">{tCommon('loading')}</div>;
  if (error) return <div className="leaderboard error">{tCommon('error', { message: error })}</div>;
  if (!data || !data.date) {
    return <div className="leaderboard empty">{tCommon('noData')}</div>;
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

  // Get leader score for pts behind calculation
  const leaderScore = sortedPlayers.length > 0 ? sortedPlayers[0][1] : 0;

  return (
    <div className="leaderboard">
      <h2>{t('title')}</h2>
      <p className="date">{t('lastUpdate', { date: data.date })}</p>

      <div className="players">
        {/* Column headers */}
        <div className="header-row">
          <div className="header-cell">{t('columns.rank')}</div>
          <div className="header-cell">{t('columns.name')}</div>
          <div className="header-cell">{t('columns.score')}</div>
          <div className="header-cell">{t('columns.delta')}</div>
          <div className="header-cell">{t('columns.streak')}</div>
          <div className="header-cell">{t('columns.ptsBehind')}</div>
        </div>

        {sortedPlayers.map(([name, score], index) => {
          const dailyGain = data.daily_gains[name] || 0;
          const rank = ranks[index];
          const isNewPlayer = newPlayers.has(name);
          const ptsBehind = leaderScore - score;
          const streak = streaks[name] || 0;

          return (
            <div key={name} className={`player-row rank-${rank}`}>
              <div className="rank">#{rank}</div>
              <div className="name">{name}</div>
              <div className="score">{score}</div>
              <div className="delta-cell">
                {isNewPlayer ? (
                  <span className="welcome-badge">{t('welcome')}</span>
                ) : dailyGain >= 4 ? (
                  <span className="gain-badge gain-epic">+{dailyGain}</span>
                ) : dailyGain >= 2 ? (
                  <span className="gain-badge gain-rare">+{dailyGain}</span>
                ) : dailyGain > 0 ? (
                  <span className="gain-badge">+{dailyGain}</span>
                ) : null}
              </div>
              <div className="streak">
                {streak >= 2 ? `${streak}🔥` : t('noStreak')}
              </div>
              <div className="pts-behind">
                {rank === 1 ? t('leader') : ptsBehind}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
