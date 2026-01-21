import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { fetchScores } from '../api';
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

const INACTIVE_COLOR = '#d1d5db';

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
  'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
];

function formatDate(dateStr) {
  // Convert "YYYY-MM-DD" to "Mon DD, YYYY"
  const [year, month, day] = dateStr.split('-');
  const monthName = MONTH_SHORT[parseInt(month, 10) - 1];
  return `${monthName} ${parseInt(day, 10)}, ${year}`;
}

export default function ProgressChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePlayer, setActivePlayer] = useState(null);

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

  if (loading) return <div className="progress-chart">Loading...</div>;
  if (error) return <div className="progress-chart error">Error: {error}</div>;
  if (!data || data.entries.length === 0) {
    return <div className="progress-chart empty">No data yet</div>;
  }

  // Extract unique players from all entries
  const allPlayers = new Set();
  data.entries.forEach((entry) => {
    Object.keys(entry.scores).forEach((player) => allPlayers.add(player));
  });
  const players = Array.from(allPlayers);

  // Calculate max score for Y axis range
  const maxScore = Math.max(
    ...data.entries.flatMap((entry) => Object.values(entry.scores))
  );
  const yAxisMax = Math.floor(maxScore / 10) * 10 + 10;

  // Build traces for each player
  const traces = players.map((player, index) => {
    const dates = [];
    const scores = [];

    data.entries.forEach((entry) => {
      dates.push(formatDate(entry.date));
      scores.push(entry.scores[player] ?? null);
    });

    const isActive = activePlayer === null || activePlayer === player;
    const color = isActive ? COLORS[index % COLORS.length] : INACTIVE_COLOR;

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
        size: isActive ? 10 : 6,
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
    title: {
      text: 'Score Progression',
      font: { size: 20, color: '#1a1a1a' },
    },
    xaxis: {
      title: 'Date',
      type: 'category',
      tickangle: -45,
      tickfont: { size: 11 },
      fixedrange: true,
    },
    yaxis: {
      title: 'Cumulative Score',
      tickfont: { size: 11 },
      range: [0, yAxisMax],
      fixedrange: true,
    },
    legend: {
      orientation: 'h',
      y: -0.35,
      x: 0.5,
      xanchor: 'center',
    },
    hovermode: 'x unified',
    plot_bgcolor: '#fafafa',
    paper_bgcolor: 'white',
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
      // Toggle: if clicking the same player, deselect; otherwise select
      setActivePlayer((prev) => (prev === clickedPlayer ? null : clickedPlayer));
    }
  };

  const handleLegendClick = (event) => {
    const clickedPlayer = event.data[event.curveNumber].name;
    // Toggle: if clicking the same player, deselect; otherwise select
    setActivePlayer((prev) => (prev === clickedPlayer ? null : clickedPlayer));
    // Return false to prevent default Plotly legend behavior (hiding trace)
    return false;
  };

  return (
    <div className="progress-chart">
      <div className="chart-header">
        <h3>Score Progression</h3>
        <div className="active-hint">
          {activePlayer ? (
            <>Showing: <strong>{activePlayer}</strong> <span>(click to reset)</span></>
          ) : (
            <span className="hint-muted">Click a line to highlight</span>
          )}
        </div>
      </div>
      <Plot
        data={traces}
        layout={{
          ...layout,
          title: null, // Remove title from chart since we have it in header
        }}
        config={config}
        style={{ width: '100%', height: '420px' }}
        onClick={handleClick}
        onLegendClick={handleLegendClick}
      />
    </div>
  );
}
