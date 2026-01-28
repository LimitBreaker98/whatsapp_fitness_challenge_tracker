import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Plot from 'react-plotly.js';
import { fetchScores } from '../api';
import { useTheme } from '../context/ThemeContext';
import VotingPanel from './VotingPanel';
import './ProgressChart.css';

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

const MARKERS = [
  'circle',
  'square',
  'diamond',
  'triangle-up',
  'triangle-down',
  'star',
  'hexagon',
  'cross',
];

const INACTIVE_COLOR_LIGHT = '#d1d5db';
const INACTIVE_COLOR_DARK = '#4b5563';

const LOCAL_STORAGE_KEY = 'chartViewPreference';

export default function ProgressChart({ selectedPlayer = null, onSelectPlayer = () => {} }) {
  const { t } = useTranslation('progressChart');
  const { t: tCommon } = useTranslation('common');
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aggregation, setAggregation] = useState('allTime');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || 'timeline';
  });
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  const isDark = theme === 'dark';
  const INACTIVE_COLOR = isDark ? INACTIVE_COLOR_DARK : INACTIVE_COLOR_LIGHT;

  // Get month names from translations
  const MONTH_SHORT = useMemo(() => [
    t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
    t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
    t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')
  ], [t]);

  const formatDate = useCallback((dateStr) => {
    const [year, month, day] = dateStr.split('-');
    const monthName = MONTH_SHORT[parseInt(month, 10) - 1];
    return `${monthName} ${parseInt(day, 10)}, ${year}`;
  }, [MONTH_SHORT]);

  const formatWeekLabel = useCallback((dateStr) => {
    const [, month, day] = dateStr.split('-');
    const monthName = MONTH_SHORT[parseInt(month, 10) - 1];
    return `${monthName} ${parseInt(day, 10)}`;
  }, [MONTH_SHORT]);

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

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, viewMode);
  }, [viewMode]);

  // Extract unique players from all entries
  const players = useMemo(() => {
    if (!data || !data.entries.length) return [];
    const allPlayers = new Set();
    data.entries.forEach((entry) => {
      Object.keys(entry.scores).forEach((player) => allPlayers.add(player));
    });
    return Array.from(allPlayers);
  }, [data]);

  // Calculate weekly data
  const weeklyData = useMemo(() => {
    if (!data || !data.entries.length) return [];

    const weeks = [];
    let currentWeek = [];
    let weekStartDate = null;

    data.entries.forEach((entry, idx) => {
      const entryDate = new Date(entry.date);
      const dayOfWeek = entryDate.getDay(); // 0 = Sunday

      // Start new week on Sunday or first entry
      if (dayOfWeek === 0 || idx === 0) {
        if (currentWeek.length > 0) {
          weeks.push({
            startDate: weekStartDate,
            entries: currentWeek,
          });
        }
        currentWeek = [entry];
        weekStartDate = entry.date;
      } else {
        currentWeek.push(entry);
      }
    });

    // Push the last week
    if (currentWeek.length > 0) {
      weeks.push({
        startDate: weekStartDate,
        entries: currentWeek,
      });
    }

    // Calculate weekly gains for each week
    return weeks.map((week, weekIdx) => {
      const gains = {};
      players.forEach((player) => {
        let weeklyGain = 0;
        week.entries.forEach((entry, entryIdx) => {
          const currentScore = entry.scores[player] ?? 0;
          let prevScore = 0;

          if (entryIdx === 0 && weekIdx > 0) {
            // Compare to last entry of previous week
            const prevWeek = weeks[weekIdx - 1];
            const lastEntry = prevWeek.entries[prevWeek.entries.length - 1];
            prevScore = lastEntry.scores[player] ?? 0;
          } else if (entryIdx > 0) {
            prevScore = week.entries[entryIdx - 1].scores[player] ?? 0;
          } else {
            // First entry of first week - use the score itself as gain
            // (or 0 if we want to show actual gains from day 1)
            prevScore = 0;
          }

          weeklyGain += currentScore - prevScore;
        });
        gains[player] = weeklyGain;
      });

      // Find week winners (can be multiple if tied)
      let maxGain = -Infinity;
      Object.values(gains).forEach((gain) => {
        if (gain > maxGain) {
          maxGain = gain;
        }
      });

      const winners = Object.entries(gains)
        .filter(([, gain]) => gain === maxGain)
        .map(([player]) => player);

      return {
        ...week,
        gains,
        winners,
        maxGain,
      };
    });
  }, [data, players]);

  // Reset week index when data changes
  useEffect(() => {
    if (weeklyData.length > 0) {
      setCurrentWeekIndex(weeklyData.length - 1); // Start at most recent week
    }
  }, [weeklyData.length]);

  // Aggregate data based on selection
  const aggregatedData = useMemo(() => {
    if (!data || !data.entries.length) return null;

    if (aggregation === 'allTime') {
      return data.entries;
    }

    const grouped = [];

    if (aggregation === 'weekly') {
      weeklyData.forEach((week) => {
        const lastEntry = week.entries[week.entries.length - 1];
        grouped.push({
          date: week.startDate,
          label: t('podiumView.weekOf', { date: formatWeekLabel(week.startDate) }),
          scores: lastEntry.scores,
        });
      });
    } else if (aggregation === 'monthly') {
      const months = {};
      data.entries.forEach((entry) => {
        const monthKey = entry.date.substring(0, 7); // YYYY-MM
        months[monthKey] = entry; // Keep last entry of each month
      });

      Object.entries(months).forEach(([monthKey, entry]) => {
        const [year, month] = monthKey.split('-');
        const monthName = MONTH_SHORT[parseInt(month, 10) - 1];
        grouped.push({
          date: entry.date,
          label: `${monthName} ${year}`,
          scores: entry.scores,
        });
      });
    }

    return grouped;
  }, [data, aggregation, weeklyData, t, MONTH_SHORT, formatWeekLabel]);

  // Navigation handlers for scroll view
  const goToPrevWeek = useCallback(() => {
    setCurrentWeekIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekIndex((prev) => Math.min(weeklyData.length - 1, prev + 1));
  }, [weeklyData.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextWeek();
      } else {
        goToPrevWeek();
      }
    }
    setTouchStart(null);
  };

  if (loading) return <div className="progress-chart">{tCommon('loading')}</div>;
  if (error) return <div className="progress-chart error">{tCommon('error', { message: error })}</div>;
  if (!data || data.entries.length === 0) {
    return <div className="progress-chart empty">{tCommon('noData')}</div>;
  }

  // Theme-aware colors for Plotly
  const textColor = isDark ? '#e5e5e5' : '#1a1a1a';
  const gridColor = isDark ? '#333' : '#e5e5e5';
  const plotBgColor = isDark ? '#1a1a1a' : '#fafafa';
  const paperBgColor = isDark ? '#1a1a1a' : 'white';

  // Timeline View (with aggregation)
  const renderTimelineView = () => {
    const entries = aggregatedData;
    const maxScore = Math.max(
      ...entries.flatMap((entry) => Object.values(entry.scores))
    );
    const yAxisMax = Math.floor(maxScore / 10) * 10 + 10;

    const traces = players.map((player, index) => {
      const dates = [];
      const scores = [];

      entries.forEach((entry) => {
        dates.push(entry.label || formatDate(entry.date));
        scores.push(entry.scores[player] ?? null);
      });

      const isActive = selectedPlayer === null || selectedPlayer === player;
      const color = isActive ? COLORS[index % COLORS.length] : INACTIVE_COLOR;

      // Reduce marker size for many data points
      const markerSize = entries.length > 30 ? 6 : entries.length > 15 ? 8 : 10;

      return {
        x: dates,
        y: scores,
        type: 'scatter',
        mode: 'lines+markers',
        name: player,
        line: {
          color: color,
          width: isActive ? 3 : 2,
        },
        marker: {
          size: isActive ? markerSize : markerSize - 2,
          color: color,
          symbol: MARKERS[index % MARKERS.length],
          line: {
            color: isActive ? color : INACTIVE_COLOR,
            width: 1,
          },
        },
        opacity: isActive ? 1 : 0.4,
        connectgaps: true,
      };
    });

    const layout = {
      xaxis: {
        title: { text: t('axisLabels.date'), font: { color: textColor } },
        type: 'category',
        tickangle: -45,
        tickfont: { size: 11, color: textColor },
        fixedrange: true,
        gridcolor: gridColor,
        linecolor: gridColor,
      },
      yaxis: {
        title: { text: t('axisLabels.score'), font: { color: textColor } },
        tickfont: { size: 11, color: textColor },
        range: [0, yAxisMax],
        fixedrange: true,
        gridcolor: gridColor,
        linecolor: gridColor,
      },
      legend: {
        orientation: 'h',
        y: -0.35,
        x: 0.5,
        xanchor: 'center',
        font: { color: textColor },
      },
      hovermode: 'x unified',
      plot_bgcolor: plotBgColor,
      paper_bgcolor: paperBgColor,
      margin: { t: 20, r: 30, b: 130, l: 60 },
    };

    const config = {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
    };

    const handleClick = (event) => {
      if (event.points && event.points.length > 0) {
        const clickedPlayer = event.points[0].data.name;
        onSelectPlayer(selectedPlayer === clickedPlayer ? null : clickedPlayer);
      }
    };

    const handleLegendClick = (event) => {
      const clickedPlayer = event.data[event.curveNumber].name;
      onSelectPlayer(selectedPlayer === clickedPlayer ? null : clickedPlayer);
      return false;
    };

    return (
      <Plot
        data={traces}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '420px' }}
        onClick={handleClick}
        onLegendClick={handleLegendClick}
      />
    );
  };

  // Podium View (weekly gains - minimal list design)
  const renderPodiumView = () => {
    if (weeklyData.length === 0) {
      return <div className="podium-view-empty">{t('podiumView.noData')}</div>;
    }

    const currentWeek = weeklyData[currentWeekIndex];
    const gains = currentWeek.gains;

    // Sort players by gains for this week
    const sortedPlayers = [...players]
      .map((player) => ({ name: player, gain: gains[player] || 0 }))
      .sort((a, b) => b.gain - a.gain);

    // Assign ranks with ties (1st, 1st, 3rd, 4th, 4th, 6th, etc.)
    const rankedPlayers = [];
    let currentRank = 1;
    sortedPlayers.forEach((player, idx) => {
      if (idx > 0 && player.gain < sortedPlayers[idx - 1].gain) {
        currentRank = idx + 1; // Skip ranks for ties
      }
      rankedPlayers.push({ ...player, rank: currentRank });
    });

    // Group players by rank
    const rankGroups = {};
    rankedPlayers.forEach((player) => {
      if (!rankGroups[player.rank]) {
        rankGroups[player.rank] = [];
      }
      rankGroups[player.rank].push(player);
    });

    // Get unique ranks in order
    const uniqueRanks = [...new Set(rankedPlayers.map((p) => p.rank))].sort((a, b) => a - b);

    const getRankLabel = (rank) => {
      if (rank === 1) return '1st';
      if (rank === 2) return '2nd';
      if (rank === 3) return '3rd';
      return `${rank}th`;
    };

    return (
      <div
        className="podium-view-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="podium-view-header">
          <button
            className="podium-nav-btn"
            onClick={goToPrevWeek}
            disabled={currentWeekIndex === 0}
          >
            &larr;
          </button>
          <div className="podium-week-info">
            <span className="week-label">
              {t('podiumView.weekOf', { date: formatWeekLabel(currentWeek.startDate) })}
            </span>
            <span className="week-counter">
              {t('podiumView.weekLabel', {
                current: currentWeekIndex + 1,
                total: weeklyData.length,
              })}
            </span>
          </div>
          <button
            className="podium-nav-btn"
            onClick={goToNextWeek}
            disabled={currentWeekIndex === weeklyData.length - 1}
          >
            &rarr;
          </button>
        </div>

        <div className="weekly-rankings">
          {uniqueRanks.map((rank) => {
            const playersAtRank = rankGroups[rank];
            const points = playersAtRank[0].gain;
            return (
              <div key={rank} className={`rank-row rank-${Math.min(rank, 4)}`}>
                <span className="rank-position">{getRankLabel(rank)}</span>
                <span className="rank-names">
                  {playersAtRank.map((p) => p.name).join(', ')}
                </span>
                <span className="rank-points">+{points}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Bars View (weekly gains bar chart)
  const renderBarsView = () => {
    if (weeklyData.length === 0) {
      return <div className="bars-view-empty">{t('podiumView.noData')}</div>;
    }

    const currentWeek = weeklyData[currentWeekIndex];
    const gains = currentWeek.gains;

    // Sort players by gains for this week (descending)
    const sortedPlayers = [...players]
      .map((player, idx) => ({ name: player, gain: gains[player] || 0, colorIdx: idx }))
      .sort((a, b) => b.gain - a.gain);

    const traces = sortedPlayers.map((player) => ({
      x: [player.name],
      y: [player.gain],
      type: 'bar',
      name: player.name,
      marker: {
        color: COLORS[players.indexOf(player.name) % COLORS.length],
      },
      text: [`+${player.gain}`],
      textposition: 'outside',
      textfont: { color: textColor, size: 14, weight: 'bold' },
      hovertemplate: `<b>${player.name}</b><br>+${player.gain} pts<extra></extra>`,
    }));

    const maxGain = Math.max(...sortedPlayers.map((p) => p.gain), 1);
    const yAxisMax = Math.ceil(maxGain * 1.2); // Add 20% headroom for labels

    const layout = {
      xaxis: {
        tickfont: { size: 12, color: textColor },
        fixedrange: true,
        gridcolor: gridColor,
        linecolor: gridColor,
      },
      yaxis: {
        title: { text: t('axisLabels.weeklyGains'), font: { color: textColor } },
        tickfont: { size: 11, color: textColor },
        range: [0, yAxisMax],
        fixedrange: true,
        gridcolor: gridColor,
        linecolor: gridColor,
      },
      showlegend: false,
      hovermode: 'closest',
      plot_bgcolor: plotBgColor,
      paper_bgcolor: paperBgColor,
      margin: { t: 40, r: 20, b: 60, l: 50 },
      bargap: 0.3,
    };

    const config = {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
    };

    return (
      <div
        className="bars-view-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bars-view-header">
          <button
            className="podium-nav-btn"
            onClick={goToPrevWeek}
            disabled={currentWeekIndex === 0}
          >
            &larr;
          </button>
          <div className="podium-week-info">
            <span className="week-label">
              {t('podiumView.weekOf', { date: formatWeekLabel(currentWeek.startDate) })}
            </span>
            <span className="week-counter">
              {t('podiumView.weekLabel', {
                current: currentWeekIndex + 1,
                total: weeklyData.length,
              })}
            </span>
          </div>
          <button
            className="podium-nav-btn"
            onClick={goToNextWeek}
            disabled={currentWeekIndex === weeklyData.length - 1}
          >
            &rarr;
          </button>
        </div>

        <Plot
          data={traces}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '350px' }}
        />
      </div>
    );
  };

  return (
    <div className="progress-chart-wrapper">
      <div className="progress-chart">
        <div className="chart-header">
          <div className="chart-header-left">
            <h3>{t('title')}</h3>
            {viewMode === 'timeline' && (
              <select
                className="aggregation-dropdown"
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value)}
              >
                <option value="allTime">{t('aggregation.allTime')}</option>
                <option value="weekly">{t('aggregation.weekly')}</option>
                <option value="monthly">{t('aggregation.monthly')}</option>
              </select>
            )}
          </div>
          <div className="chart-header-right">
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
                title={t('viewToggle.timeline')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'podium' ? 'active' : ''}`}
                onClick={() => setViewMode('podium')}
                title={t('viewToggle.podium')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'bars' ? 'active' : ''}`}
                onClick={() => setViewMode('bars')}
                title={t('viewToggle.bars')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="12" width="4" height="9" />
                  <rect x="10" y="6" width="4" height="15" />
                  <rect x="17" y="3" width="4" height="18" />
                </svg>
              </button>
            </div>
            {viewMode === 'timeline' && (
              <div className="active-hint">
                {selectedPlayer ? (
                  <>{t('showing', { player: selectedPlayer })} <span>{t('clickToReset')}</span></>
                ) : (
                  <span className="hint-muted">{t('hint')}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'podium' && renderPodiumView()}
        {viewMode === 'bars' && renderBarsView()}
      </div>

      <VotingPanel />
    </div>
  );
}
