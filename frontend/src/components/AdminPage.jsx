import { useState } from 'react';
import { submitUpdate } from '../api';
import './AdminPage.css';

const SESSION_KEY = 'admin_api_key';

export default function AdminPage() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(SESSION_KEY) || '');
  const [keyInput, setKeyInput] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error' | 'warning', text: string }
  const [loading, setLoading] = useState(false);
  const [pendingOverwrite, setPendingOverwrite] = useState(null); // { message, date }

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
      setStatus({ type: 'error', text: 'Please enter a message' });
      return;
    }

    if (!apiKey) {
      setStatus({ type: 'error', text: 'API key required (add ?key=xxx to URL)' });
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
        <h2>Admin Login</h2>
        <p className="instructions">Enter your API key to access the admin panel.</p>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Enter API key..."
            autoFocus
          />
          <button type="submit" disabled={!keyInput.trim()}>
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Submit Daily Update</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <p className="instructions">
        Paste the daily score message below. Format:
      </p>
      <pre className="format-example">
{`January 18
Pepo: 12
Mene: 10
Josh: 9
Pocho: 8`}
      </pre>

      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Paste daily update here..."
          rows={8}
          disabled={loading || pendingOverwrite}
        />

        <button type="submit" disabled={loading || pendingOverwrite}>
          {loading ? 'Submitting...' : 'Submit Update'}
        </button>
      </form>

      {status && (
        <div className={`status ${status.type}`}>
          {status.text}
        </div>
      )}

      {pendingOverwrite && (
        <div className="confirmation-dialog">
          <p>An entry for <strong>{pendingOverwrite.date}</strong> already exists.</p>
          <p>Do you want to overwrite it?</p>
          <div className="confirmation-buttons">
            <button
              className="confirm-btn"
              onClick={handleConfirmOverwrite}
              disabled={loading}
            >
              {loading ? 'Overwriting...' : 'Yes, Overwrite'}
            </button>
            <button
              className="cancel-btn"
              onClick={handleCancelOverwrite}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
