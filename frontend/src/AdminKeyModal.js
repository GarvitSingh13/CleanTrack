import React, { useState } from 'react';
import './AdminKeyModal.css';

function AdminKeyModal({ onClose, onSuccess }) {
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secretKey) return;

    setLoading(true);
    setError('');
    setShake(false);

    try {
      const response = await fetch('http://localhost:5000/api/admin/verify-secret-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey })
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.message || 'Verification failed');
        setSecretKey('');
        setShake(true);
        // remove shake class after animation completes so it can trigger again
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <button className="close-btn" onClick={onClose} title="Close">&times;</button>
        <h2>Admin Gateway 🔒</h2>
        <p>Please enter the Master Secret Key to access the administration panel.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter Secret Key"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className={`secret-input ${error ? 'input-error' : ''}`}
            autoFocus
          />
          {error && <div className={`error-message ${shake ? 'shake' : ''}`}>{error}</div>}

          <button type="submit" className="submit-sec-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Unlock Gateway'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminKeyModal;
