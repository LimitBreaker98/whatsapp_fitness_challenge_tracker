import { useState, useEffect } from 'react';
import { fetchLatest, fetchScores } from '../api';
import './Leaderboard.css';

// Calculate ranks with ties from a scores object
function calculateRanks(scores) {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const rankMap = {};
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i][1] < sorted[i - 1][1]) {
      currentRank = i + 1;
    }
    rankMap[sorted[i][0]] = currentRank;
  }
  return rankMap;
}

// Calculate streak (consecutive days with gains > 0)
function calculateStreaks(entries) {
  const streaks = {};
  if (entries.length === 0) return streaks;

  // Get all players from latest entry
  const latestEntry = entries[entries.length - 1];
  const players = Object.keys(latestEntry.scores);

  for (const player of players) {
    let streak = 0;
    // Go backwards through entries
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      const gain = entry.daily_gains?.[player] || 0;
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
  const [data, setData] = useState(null);
  const [maxScore, setMaxScore] = useState(0);
  const [newPlayers, setNewPlayers] = useState(new Set());
  const [yesterdayRanks, setYesterdayRanks] = useState({});
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

        // Calculate yesterday's ranks for trend
        let prevRanks = {};
        if (entries.length >= 2) {
          const yesterdayEntry = entries[entries.length - 2];
          prevRanks = calculateRanks(yesterdayEntry.scores);
        }

        // Calculate streaks
        const playerStreaks = calculateStreaks(entries);

        setData(latest);
        setMaxScore(max);
        setNewPlayers(newPlayerSet);
        setYesterdayRanks(prevRanks);
        setStreaks(playerStreaks);
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

  // Get leader score for pts behind calculation
  const leaderScore = sortedPlayers.length > 0 ? sortedPlayers[0][1] : 0;

  // Helper to get trend info
  const getTrend = (name, currentRank) => {
    const prevRank = yesterdayRanks[name];
    if (prevRank === undefined) {
      return { arrow: '→', className: 'trend-same', diff: 0 };
    }
    const diff = prevRank - currentRank;
    if (diff > 0) {
      return { arrow: '↗', className: 'trend-up', diff };
    } else if (diff < 0) {
      return { arrow: '↘', className: 'trend-down', diff: Math.abs(diff) };
    }
    return { arrow: '→', className: 'trend-same', diff: 0 };
  };

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <p className="date">Last update: {data.date}</p>

      <div className="players">
        {/* Column headers */}
        <div className="header-row">
          <div className="header-cell">Rank</div>
          <div className="header-cell">Name</div>
          <div className="header-cell">Score</div>
          <div className="header-cell">Trend</div>
          <div className="header-cell">Streak</div>
          <div className="header-cell">Δ</div>
          <div className="header-cell">Pts Behind</div>
        </div>

        {sortedPlayers.map(([name, score], index) => {
          const dailyGain = data.daily_gains[name] || 0;
          const rank = ranks[index];
          const isNewPlayer = newPlayers.has(name);
          const ptsBehind = score - leaderScore;
          const trend = getTrend(name, rank);
          const streak = streaks[name] || 0;

          return (
            <div key={name} className={`player-row rank-${rank}`}>
              <div className="rank">#{rank}</div>
              <div className="name">{name}</div>
              <div className="score">{score}</div>
              <div className={`trend-badge ${trend.className}`}>
                {trend.arrow}
                {trend.diff > 0 && trend.diff}
              </div>
              <div className="streak">
                {streak >= 2 ? `${streak}🔥` : '—'}
              </div>
              <div className="delta-cell">
                {isNewPlayer ? (
                  <span className="welcome-badge">Welcome!</span>
                ) : dailyGain >= 4 ? (
                  <span className="gain-badge gain-epic">+{dailyGain}</span>
                ) : dailyGain >= 2 ? (
                  <span className="gain-badge gain-rare">+{dailyGain}</span>
                ) : dailyGain > 0 ? (
                  <span className="gain-badge">+{dailyGain}</span>
                ) : null}
              </div>
              <div className="pts-behind">
                {rank === 1 ? '—' : ptsBehind}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
