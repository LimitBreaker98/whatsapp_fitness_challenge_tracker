import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchVotes, fetchVotesHistory, submitVote } from '../api';
import './VotingsPage.css';

export default function VotingsPage() {
  const { t } = useTranslation('votings');
  const { t: tCommon } = useTranslation('common');

  const [voteData, setVoteData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vote form state
  const [code, setCode] = useState('');
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [votes, historyData] = await Promise.all([
          fetchVotes(),
          fetchVotesHistory(),
        ]);
        setVoteData(votes);
        setHistory(historyData.history || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleVote = async () => {
    if (!code.trim() || !selectedChoice) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const result = await submitVote(code.trim(), selectedChoice);
      setStatus('success');
      setStatusMessage(t('status.thankYou', { name: result.name }));

      // Update local vote data
      setVoteData((prev) => ({
        ...prev,
        vote_counts: {
          ...prev.vote_counts,
          [selectedChoice]: (prev.vote_counts[selectedChoice] || 0) + 1,
        },
        votes_cast: prev.votes_cast + 1,
      }));

      setCode('');
      setSelectedChoice(null);
    } catch (err) {
      const message = err.message;
      if (message.includes('already voted')) {
        setStatus('error');
        setStatusMessage(t('status.alreadyVoted'));
      } else if (message.includes('Invalid code')) {
        setStatus('error');
        setStatusMessage(t('status.invalidCode'));
      } else if (message.includes('Too many attempts')) {
        setStatus('error');
        setStatusMessage(t('status.rateLimited'));
      } else if (message.includes('No active vote')) {
        setStatus('error');
        setStatusMessage(t('status.votingClosed'));
      } else {
        setStatus('error');
        setStatusMessage(t('status.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="votings-page">{tCommon('loading')}</div>;
  }

  if (error) {
    return <div className="votings-page error">{tCommon('error', { message: error })}</div>;
  }

  const isActive = voteData?.is_active;
  const votesRemaining = voteData ? voteData.total_voters - voteData.votes_cast : 0;
  const allVoted = votesRemaining <= 0;

  // Determine winner for current vote
  let currentWinner = null;
  if (allVoted && voteData?.vote_counts && voteData?.options) {
    const maxVotes = Math.max(...Object.values(voteData.vote_counts));
    const winners = voteData.options.filter(
      (opt) => voteData.vote_counts[opt.key] === maxVotes
    );
    currentWinner = winners.length === 1 ? winners[0].label : null;
  }

  return (
    <div className="votings-page">
      <h2>{t('title')}</h2>

      {/* Current Vote Section */}
      <section className="current-vote-section">
        <h3>{t('currentVote.title')}</h3>

        {!isActive ? (
          <div className="no-active-vote">
            {t('currentVote.noActiveVote')}
          </div>
        ) : (
          <div className="voting-panel">
            <h4>{voteData.topic}</h4>

            <div className="vote-buttons">
              {voteData.options.map((option) => (
                <button
                  key={option.key}
                  className={`vote-btn ${selectedChoice === option.key ? 'selected' : ''}`}
                  onClick={() => setSelectedChoice(option.key)}
                  disabled={submitting || allVoted}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {!allVoted && (
              <div className="vote-input-row">
                <input
                  type="text"
                  placeholder={t('form.codePlaceholder')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={submitting}
                  className="vote-code-input"
                />
                <button
                  className="vote-submit-btn"
                  onClick={handleVote}
                  disabled={submitting || !code.trim() || !selectedChoice}
                >
                  {submitting ? t('form.submitting') : t('form.voteButton')}
                </button>
              </div>
            )}

            {status && (
              <div className={`vote-status ${status}`}>
                {statusMessage}
              </div>
            )}

            {allVoted ? (
              <div className="vote-result">
                {currentWinner
                  ? t('currentVote.winner', { choice: currentWinner })
                  : t('currentVote.tie')}
              </div>
            ) : (
              <div className="vote-progress">
                {t('currentVote.votesRemaining', { count: votesRemaining })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* History Section */}
      <section className="history-section">
        <h3>{t('history.title')}</h3>

        {history.length === 0 ? (
          <div className="no-history">
            {t('history.noHistory')}
          </div>
        ) : (
          <div className="history-list">
            {[...history].reverse().map((record) => (
              <HistoryCard key={record.id} record={record} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HistoryCard({ record, t }) {
  const formattedDate = new Date(record.finalized_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="history-card">
      <div className="history-card-header">
        <span className="history-topic">{record.topic}</span>
        <span className="history-date">
          {t('history.finalizedAt')}: {formattedDate}
        </span>
      </div>

      <div className="history-card-body">
        <div className="history-options">
          {record.options.map((opt) => (
            <div key={opt.key} className="history-option">
              <span className="option-label">{opt.label}</span>
              <span className="option-count">{record.vote_counts[opt.key] || 0}</span>
            </div>
          ))}
        </div>

        <div className="history-result">
          {record.winner
            ? t('history.winner', { choice: record.winner })
            : t('history.tie')}
        </div>

        <div className="history-meta">
          <span>{t('history.totalVotes', { count: record.total_votes })}</span>
          {record.voters && record.voters.length > 0 && (
            <span className="history-voters">
              {t('history.voters', { names: record.voters.join(', ') })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
