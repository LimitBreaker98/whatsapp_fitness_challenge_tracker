import { useState, useEffect } from 'react';
import { fetchScores } from '../api';
import './FunStats.css';

// Mene didn't bet, everyone else put in $20
const BET_AMOUNT = 20;
const FREE_RIDER = 'Mene';
const DISTRIBUTION = [50, 35, 10, 5, 0];

export default function FunStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const scores = await fetchScores();
        setData(scores);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return null;
  if (error || !data || !data.entries || data.entries.length < 2) return null;

  const entries = data.entries;
  const players = Object.keys(entries[entries.length - 1].scores);

  // Calculate money in play (everyone except Mene)
  const bettingPlayers = players.filter(p => p !== FREE_RIDER);
  const totalPot = bettingPlayers.length * BET_AMOUNT;

  // Calculate streaks (consecutive days with gains > 0)
  const streaks = calculateStreaks(entries, players);
  const activeStreaks = streaks.filter(s => s.streak >= 2).sort((a, b) => b.streak - a.streak);

  // Calculate consistency (lowest coefficient of variation in daily gains)
  const consistency = calculateConsistency(entries, players);

  // Find rivalries (players within 5 points of each other)
  const latestScores = entries[entries.length - 1].scores;
  const rivalries = findRivalries(latestScores);

  // Find slackers (no points in last 2+ days)
  const slackers = findSlackers(entries, players);

  return (
    <div className="fun-stats">
      {/* Money cards - smaller */}
      <div className="fun-card mini-card pot-card">
        <div className="fun-card-icon">💰</div>
        <div className="fun-card-content">
          <h4>Prize Pool</h4>
          <p className="big-number">${totalPot}</p>
          <span className="fun-card-detail">{bettingPlayers.length} players × ${BET_AMOUNT}</span>
        </div>
      </div>

      <div className="fun-card mini-card distribution-card">
        <div className="fun-card-icon">🏆</div>
        <div className="fun-card-content">
          <h4>Payout Split</h4>
          <div className="distribution-bars">
            {DISTRIBUTION.map((pct, i) => (
              <div key={i} className="dist-item">
                <span className="dist-place">#{i + 1}</span>
                <div className="dist-bar-bg">
                  <div className="dist-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="dist-pct">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="fun-card streak-card">
        <div className="fun-card-icon">🔥</div>
        <div className="fun-card-content">
          <h4>Hot Streak</h4>
          {activeStreaks.length > 0 ? (
            activeStreaks.slice(0, 2).map(({ player, streak }) => (
              <p key={player}>
                <strong>{player}</strong> is on a {streak}-day streak!
              </p>
            ))
          ) : (
            <p className="empty-state">No active streaks yet</p>
          )}
        </div>
      </div>

      <div className="fun-card consistent-card">
        <div className="fun-card-icon">🎯</div>
        <div className="fun-card-content">
          <h4>Most Consistent</h4>
          {consistency ? (
            <>
              <p>
                <strong>{consistency.player}</strong> — "The Machine"
              </p>
              <span className="fun-card-detail">
                Avg {consistency.avgGain.toFixed(1)} pts/day
              </span>
            </>
          ) : (
            <p className="empty-state">Need more data...</p>
          )}
        </div>
      </div>

      <div className="fun-card rivalry-card">
        <div className="fun-card-icon">⚔️</div>
        <div className="fun-card-content">
          <h4>Rivalry Watch</h4>
          {rivalries.length > 0 ? (
            rivalries.slice(0, 1).map(({ player1, player2, gap }, i) => (
              <p key={i}>
                <strong>{player1}</strong> vs <strong>{player2}</strong>
                <span className="rivalry-gap">{gap} pts apart!</span>
              </p>
            ))
          ) : (
            <p className="empty-state">No close battles right now</p>
          )}
        </div>
      </div>

      <div className="fun-card slacker-card">
        <div className="fun-card-icon">😴</div>
        <div className="fun-card-content">
          <h4>Slacker Alert</h4>
          {slackers.length > 0 ? (
            <>
              <p>
                <strong>{slackers[0].player}</strong> hasn't scored in {slackers[0].days} days...
              </p>
              <span className="fun-card-detail">Time to get moving!</span>
            </>
          ) : (
            <p className="empty-state">Everyone's putting in work!</p>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateStreaks(entries, players) {
  const streaks = [];

  for (const player of players) {
    let streak = 0;

    // Go backwards from most recent
    for (let i = entries.length - 1; i > 0; i--) {
      const currentScore = entries[i].scores[player] || 0;
      const prevScore = entries[i - 1].scores[player] || 0;
      const gain = currentScore - prevScore;

      if (gain > 0) {
        streak++;
      } else {
        break;
      }
    }

    streaks.push({ player, streak });
  }

  return streaks;
}

function calculateConsistency(entries, players) {
  if (entries.length < 3) return null;

  const playerStats = [];

  for (const player of players) {
    const gains = [];

    for (let i = 1; i < entries.length; i++) {
      const currentScore = entries[i].scores[player] || 0;
      const prevScore = entries[i - 1].scores[player] || 0;
      gains.push(currentScore - prevScore);
    }

    if (gains.length < 2) continue;

    const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;

    // Skip players with 0 or negative average (not active)
    if (avgGain <= 0) continue;

    const variance = gains.reduce((sum, g) => sum + Math.pow(g - avgGain, 2), 0) / gains.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgGain; // Coefficient of variation

    playerStats.push({ player, cv, avgGain, stdDev });
  }

  if (playerStats.length === 0) return null;

  // Lowest CV = most consistent
  playerStats.sort((a, b) => a.cv - b.cv);
  return playerStats[0];
}

function findRivalries(scores) {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const rivalries = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const [player1, score1] = sorted[i];
    const [player2, score2] = sorted[i + 1];
    const gap = score1 - score2;

    if (gap <= 5 && gap >= 0) {
      rivalries.push({ player1, player2, gap });
    }
  }

  return rivalries;
}

function findSlackers(entries, players) {
  if (entries.length < 2) return [];

  const slackers = [];

  for (const player of players) {
    let daysWithoutGain = 0;

    for (let i = entries.length - 1; i > 0; i--) {
      const currentScore = entries[i].scores[player] || 0;
      const prevScore = entries[i - 1].scores[player] || 0;
      const gain = currentScore - prevScore;

      if (gain <= 0) {
        daysWithoutGain++;
      } else {
        break;
      }
    }

    if (daysWithoutGain >= 2) {
      slackers.push({ player, days: daysWithoutGain });
    }
  }

  // Sort by most days without gain
  slackers.sort((a, b) => b.days - a.days);
  return slackers;
}
