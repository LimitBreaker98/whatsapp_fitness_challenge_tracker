import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchLatest, submitUpdate } from '../api';
import './AdminPage.css';

const SESSION_KEY = 'admin_api_key';
const FALLBACK_EXAMPLE = `January 18
Pepo: 12
Mene: 10
Josh: 9
Pocho: 8`;

export default function AdminPage() {
  const { t } = useTranslation('admin');
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(SESSION_KEY) || '');
  const [keyInput, setKeyInput] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error' | 'warning', text: string }
  const [loading, setLoading] = useState(false);
  const [pendingOverwrite, setPendingOverwrite] = useState(null); // { message, date }
  const [latestEntry, setLatestEntry] = useState(null);
  const [loadingExample, setLoadingExample] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLatest() {
      try {
        const latest = await fetchLatest();
        if (!isMounted) return;
        if (latest?.date) {
          setLatestEntry({ date: latest.date, scores: latest.scores || {} });
        } else {
          setLatestEntry(null);
        }
      } catch (err) {
        if (isMounted) {
          setLatestEntry(null);
        }
      } finally {
        if (isMounted) {
          setLoadingExample(false);
        }
      }
    }

    loadLatest();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;
    // Keep English month names so the backend parser accepts copy/paste.
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const buildExample = () => {
    if (!latestEntry) return '';
    const dateLine = formatDate(latestEntry.date);
    const scores = Object.entries(latestEntry.scores || {}).sort(
      ([, a], [, b]) => b - a
    );
    const lines = [dateLine, ...scores.map(([name, score]) => `${name}: ${score}`)];
    return lines.join('\n').trim();
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (keyInput.trim()) {
      sessionStorage.setItem(SESSION_KEY, keyInput.trim());
      setApiKey(keyInput.trim());
      setKeyInput('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setApiKey('');
    setStatus(null);
  };

  const handleSubmit = async (e, force = false) => {
    if (e) e.preventDefault();

    const msgToSubmit = force ? pendingOverwrite?.message : message;

    if (!msgToSubmit?.trim()) {
      setStatus({ type: 'error', text: t('errors.emptyMessage') });
      return;
    }

    if (!apiKey) {
      setStatus({ type: 'error', text: t('errors.apiKeyRequired') });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const result = await submitUpdate(msgToSubmit, apiKey, force);

      if (result.requires_confirmation) {
        // Entry exists, ask for confirmation
        setPendingOverwrite({ message: msgToSubmit, date: result.date });
        setStatus({
          type: 'warning',
          text: result.message,
        });
      } else {
        // Success
        setStatus({ type: 'success', text: result.message });
        setMessage('');
        setPendingOverwrite(null);
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
      setPendingOverwrite(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOverwrite = () => {
    handleSubmit(null, true);
  };

  const handleCancelOverwrite = () => {
    setPendingOverwrite(null);
    setStatus(null);
  };

  // Show login form if not authenticated
  if (!apiKey) {
    return (
      <div className="admin-page">
        <h2>{t('login.title')}</h2>
        <p className="instructions">{t('login.instructions')}</p>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={t('login.placeholder')}
            autoFocus
          />
          <button type="submit" disabled={!keyInput.trim()}>
            {t('login.button')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>{t('submit.title')}</h2>
        <button className="logout-btn" onClick={handleLogout}>
          {t('submit.logout')}
        </button>
      </div>
      <p className="instructions">
        {t('submit.instructions')}
      </p>
      <div className="example-label">
        {loadingExample
          ? t('submit.exampleLoading')
          : latestEntry
            ? t('submit.exampleLabel')
            : t('submit.exampleFallbackLabel')}
      </div>
      <pre className="format-example">
        {loadingExample ? t('submit.exampleLoading') : buildExample() || FALLBACK_EXAMPLE}
      </pre>

      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('submit.placeholder')}
          rows={8}
          disabled={loading || pendingOverwrite}
        />

        <button type="submit" disabled={loading || pendingOverwrite}>
          {loading ? t('submit.submitting') : t('submit.button')}
        </button>
      </form>

      {status && (
        <div className={`status ${status.type}`}>
          {status.text}
        </div>
      )}

      {pendingOverwrite && (
        <div className="confirmation-dialog">
          <p>{t('confirmation.exists', { date: pendingOverwrite.date })}</p>
          <p>{t('confirmation.overwrite')}</p>
          <div className="confirmation-buttons">
            <button
              className="confirm-btn"
              onClick={handleConfirmOverwrite}
              disabled={loading}
            >
              {loading ? t('confirmation.overwriting') : t('confirmation.yesOverwrite')}
            </button>
            <button
              className="cancel-btn"
              onClick={handleCancelOverwrite}
              disabled={loading}
            >
              {t('confirmation.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
