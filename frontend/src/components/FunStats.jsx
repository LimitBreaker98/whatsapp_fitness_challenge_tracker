import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchScores } from '../api';
import './FunStats.css';

// Mene didn't bet, everyone else put in $20
const BET_AMOUNT = 20;
const FREE_RIDER = 'Mene';
const DISTRIBUTION = [50, 35, 10, 5, 0];

export default function FunStats() {
  const { t } = useTranslation('funStats');
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

  // Get all players tied at top streak
  const maxStreak = activeStreaks.length > 0 ? activeStreaks[0].streak : 0;
  const topStreakers = activeStreaks.filter(s => s.streak === maxStreak);

  // Calculate consistency (lowest coefficient of variation in daily gains)
  const consistencyResults = calculateConsistency(entries, players);

  // Find rivalries (players within 5 points of each other)
  const latestScores = entries[entries.length - 1].scores;
  const rivalries = findRivalries(latestScores, entries);

  // Find big mover (biggest single-day gain in last 7 days)
  const bigMover = findBigMover(entries);

  return (
    <div className="fun-stats">
      {/* Money cards - smaller */}
      <div className="fun-card mini-card pot-card">
        <div className="fun-card-icon">💰</div>
        <div className="fun-card-content">
          <h4>{t('prizePool.title')}</h4>
          <p className="big-number">${totalPot}</p>
          <span className="fun-card-detail">{t('prizePool.detail', { count: bettingPlayers.length, amount: BET_AMOUNT })}</span>
        </div>
      </div>

      <div className="fun-card mini-card distribution-card">
        <div className="fun-card-icon">🏆</div>
        <div className="fun-card-content">
          <h4>{t('payoutSplit.title')}</h4>
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
          <span className="fun-card-detail last-place-penalty">{t('payoutSplit.lastPlacePenalty')}</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className={`fun-card streak-card${maxStreak >= 5 ? ' blazing' : ''}`}>
        <div className="fun-card-icon">🔥</div>
        <div className="fun-card-content">
          <h4>{t('hotStreak.title')}</h4>
          {topStreakers.length > 0 ? (
            topStreakers.length === 1 ? (
              <p>{t('hotStreak.single', { player: topStreakers[0].player, count: maxStreak })}</p>
            ) : (
              <p>{t('hotStreak.multiple', { count: maxStreak, players: topStreakers.map(s => s.player).join(', ') })}</p>
            )
          ) : (
            <p className="empty-state">{t('hotStreak.empty')}</p>
          )}
        </div>
      </div>

      <div className="fun-card consistent-card">
        <div className="fun-card-icon">🎯</div>
        <div className="fun-card-content">
          <h4>{t('mostConsistent.title')}</h4>
          {consistencyResults && consistencyResults.length > 0 ? (
            consistencyResults.length === 1 ? (
              <>
                <p>
                  <strong>{consistencyResults[0].player}</strong> — {t('mostConsistent.nickname')}
                </p>
                <span className="fun-card-detail">
                  {t('mostConsistent.avgGain', { value: consistencyResults[0].avgGain.toFixed(1) })}
                </span>
              </>
            ) : (
              <p>{t('mostConsistent.tie', { count: consistencyResults.length, players: consistencyResults.map(p => p.player).join(', ') })}</p>
            )
          ) : (
            <p className="empty-state">{t('mostConsistent.empty')}</p>
          )}
        </div>
      </div>

      <div className={`fun-card rivalry-card${rivalries.length > 0 && rivalries[0].isTied ? ' neck-neck' : ''}`}>
        <div className="fun-card-icon">⚔️</div>
        <div className="fun-card-content">
          <h4>{t('rivalryWatch.title')}</h4>
          {rivalries.length > 0 ? (
            rivalries.slice(0, 1).map((rivalry, i) => (
              <div key={i}>
                {rivalry.isLeadTie ? (
                  <>
                    <span className="neck-neck-badge">{t('rivalryWatch.neckNeck')}</span>
                    <p>
                      <strong>{rivalry.tiedPlayers.join(', ')}</strong>
                      <span className="rivalry-detail">{t('rivalryWatch.leadTie', { count: rivalry.tiedPlayers.length })}</span>
                    </p>
                  </>
                ) : rivalry.isTied ? (
                  <>
                    <span className="neck-neck-badge">{t('rivalryWatch.neckNeck')}</span>
                    <p>
                      <strong>{rivalry.player1}</strong> vs <strong>{rivalry.player2}</strong>
                      <span className="rivalry-detail">{t('rivalryWatch.battle', { rank: rivalry.rank })}</span>
                    </p>
                  </>
                ) : (
                  <p>
                    <strong>{rivalry.player2}</strong> {t('rivalryWatch.closing', { player: rivalry.player1 })}
                    <span className="rivalry-gap">
                      {rivalry.gap} pts
                      {rivalry.momentum === 'closing' && <span className="momentum-arrow up"></span>}
                      {rivalry.momentum === 'widening' && <span className="momentum-arrow down"></span>}
                    </span>
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="empty-state">{t('rivalryWatch.empty')}</p>
          )}
        </div>
      </div>

      <div className={`fun-card big-mover-card${bigMover ? ' has-mover' : ''}`}>
        <div className="fun-card-icon">
          <span className="rocket-icon">🚀</span>
        </div>
        <div className="fun-card-content">
          <h4>{t('bigMover.title')}</h4>
          {bigMover ? (
            <p>
              <strong>{bigMover.player}</strong> {t('bigMover.message', { gain: bigMover.gain, date: bigMover.date })}
            </p>
          ) : (
            <p className="empty-state">{t('bigMover.empty')}</p>
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

  // Find all players essentially tied (within 0.05 CV)
  const bestCV = playerStats[0].cv;
  const tied = playerStats.filter(p => Math.abs(p.cv - bestCV) < 0.05);

  return tied;
}

function findRivalries(scores, entries) {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const rivalries = [];
  const prevScores = entries.length >= 2 ? entries[entries.length - 2].scores : null;

  // First, check for N-way ties at the lead
  const topScore = sorted[0][1];
  const tiedAtLead = sorted.filter(([, score]) => score === topScore);

  if (tiedAtLead.length >= 2) {
    // N-way tie for the lead
    rivalries.push({
      tiedPlayers: tiedAtLead.map(([player]) => player),
      gap: 0,
      isTied: true,
      isLeadTie: true,
      rank: 1
    });
    return rivalries;
  }

  // Otherwise, find close rivalries between consecutive players
  for (let i = 0; i < sorted.length - 1; i++) {
    const [player1, score1] = sorted[i];
    const [player2, score2] = sorted[i + 1];
    const gap = score1 - score2;

    if (gap <= 5 && gap >= 0) {
      // Calculate momentum
      let momentum = 'even';
      if (prevScores) {
        const gain1 = score1 - (prevScores[player1] || score1);
        const gain2 = score2 - (prevScores[player2] || score2);
        momentum = gain2 > gain1 ? 'closing' : gain1 > gain2 ? 'widening' : 'even';
      }

      rivalries.push({
        player1,
        player2,
        gap,
        isTied: gap === 0,
        isLeadTie: false,
        momentum,
        rank: i + 1
      });
    }
  }

  return rivalries;
}

function findBigMover(entries) {
  if (entries.length < 2) return null;

  // Look at last 3 weeks (21 days)
  const recent = entries.slice(-21);
  let best = { player: null, gain: 0, date: null };

  for (let i = 1; i < recent.length; i++) {
    for (const player of Object.keys(recent[i].scores)) {
      const gain = recent[i].scores[player] - (recent[i - 1].scores[player] || 0);
      // Only consider +2 and above, prefer higher gains and more recent
      if (gain >= 2 && (gain > best.gain || (gain === best.gain && gain > 0))) {
        best = { player, gain, date: recent[i].date };
      }
    }
  }

  // Only return if we found a +2 or higher
  return best.gain >= 2 ? best : null;
}
