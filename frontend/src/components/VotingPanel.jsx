import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchVotes, submitVote } from '../api';
import './VotingPanel.css';

const TOTAL_VOTERS = 7;

export default function VotingPanel() {
  const { t } = useTranslation('voting');
  const [votes, setVotes] = useState({ timeline: 0, podium: 0, both: 0 });
  const [code, setCode] = useState('');
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [status, setStatus] = useState(null); // 'success', 'error', 'already_voted', 'invalid_code'
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const totalVotes = votes.timeline + votes.podium + votes.both;
  const allVoted = totalVotes >= TOTAL_VOTERS;

  // Determine winner - "both" votes count toward both options for determining preference
  const timelineTotal = votes.timeline + votes.both;
  const podiumTotal = votes.podium + votes.both;
  const winner = timelineTotal > podiumTotal ? 'Timeline' : podiumTotal > timelineTotal ? 'Podium' : null;

  useEffect(() => {
    async function loadVotes() {
      try {
        const data = await fetchVotes();
        setVotes(data);
      } catch (err) {
        console.error('Failed to load votes:', err);
      }
    }
    loadVotes();
  }, []);

  const handleVote = async () => {
    if (!code.trim() || !selectedChoice) return;

    setLoading(true);
    setStatus(null);

    try {
      const result = await submitVote(code.trim(), selectedChoice);
      setStatus('success');
      setStatusMessage(t('thankYou', { name: result.name }));
      setVotes((prev) => ({
        ...prev,
        [selectedChoice]: prev[selectedChoice] + 1,
      }));
      setCode('');
      setSelectedChoice(null);
    } catch (err) {
      const message = err.message;
      if (message.includes('already voted')) {
        setStatus('already_voted');
        setStatusMessage(t('alreadyVoted'));
      } else if (message.includes('Invalid code')) {
        setStatus('invalid_code');
        setStatusMessage(t('invalidCode'));
      } else if (message.includes('Too many attempts')) {
        setStatus('rate_limited');
        setStatusMessage(t('rateLimited'));
      } else {
        setStatus('error');
        setStatusMessage(t('error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="voting-panel">
      <h4>{t('question')}</h4>

      <div className="vote-buttons">
        <button
          className={`vote-btn ${selectedChoice === 'timeline' ? 'selected' : ''}`}
          onClick={() => setSelectedChoice('timeline')}
          disabled={loading}
        >
          {t('timelineLabel')}
        </button>
        <button
          className={`vote-btn ${selectedChoice === 'podium' ? 'selected' : ''}`}
          onClick={() => setSelectedChoice('podium')}
          disabled={loading}
        >
          {t('podiumLabel')}
        </button>
        <button
          className={`vote-btn ${selectedChoice === 'both' ? 'selected' : ''}`}
          onClick={() => setSelectedChoice('both')}
          disabled={loading}
        >
          {t('bothLabel')}
        </button>
      </div>

      <div className="vote-input-row">
        <input
          type="text"
          placeholder={t('codePlaceholder')}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={loading}
          className="vote-code-input"
        />
        <button
          className="vote-submit-btn"
          onClick={handleVote}
          disabled={loading || !code.trim() || !selectedChoice}
        >
          {loading ? t('submitting') : t('voteButton')}
        </button>
      </div>

      {status && (
        <div className={`vote-status ${status}`}>
          {statusMessage}
        </div>
      )}

      {allVoted ? (
        <div className="vote-result">
          {winner ? t('winner', { choice: winner }) : t('tie')}
        </div>
      ) : (
        <div className="vote-progress">
          {t('votesRemaining', { count: TOTAL_VOTERS - totalVotes })}
        </div>
      )}
    </div>
  );
}
