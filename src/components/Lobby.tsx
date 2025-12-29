import { useState } from 'react';
import { useGame } from '../context/GameContext';

export const Lobby = () => {
  const { network, peerId, dispatch } = useGame();
  const [view, setView] = useState<'menu' | 'host' | 'join'>('menu');
  const [remoteId, setRemoteId] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting'>('idle');

  const copyId = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (!remoteId) return;
    setStatus('connecting');
    network.connectTo(remoteId, () => {
      // Create handshake
      network.sendMessage({ type: 'HANDSHAKE', payload: { name: 'Player' } });
    });
  };

  const renderMenu = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <button
        onClick={() => dispatch({ type: 'START_SINGLE_PLAYER' })}
        style={{
          padding: '1.5rem',
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '1.25rem',
          fontWeight: 800,
          boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
        }}
      >
        PLAY SOLO vs CPU
      </button>
      <button
        onClick={() => setView('host')}
        style={{
          padding: '1.5rem',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '1.25rem',
          fontWeight: 800,
          boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.3)'
        }}
      >
        START NEW GAME (P2P)
      </button>
      <button
        onClick={() => setView('join')}
        style={{
          padding: '1.5rem',
          background: 'white',
          color: 'var(--text-main)',
          border: '2px solid var(--tile-border)',
          borderRadius: '12px',
          fontSize: '1.25rem',
          fontWeight: 800
        }}
      >
        JOIN A GAME
      </button>
    </div>
  );

  const renderHost = () => (
    <div>
      <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Waiting for Player...</h2>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#666' }}>
        Share this code with your friend to start.
      </p>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#64748b' }}>YOUR GAME CODE</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '8px',
              background: 'white',
              fontFamily: 'monospace',
              fontSize: '1.5rem',
              color: 'var(--text-main)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textAlign: 'center',
              border: '2px dashed #cbd5e1'
            }}
          >
            {peerId || 'Generating...'}
          </div>
        </div>
        <button
          onClick={copyId}
          style={{
            marginTop: '1rem',
            width: '100%',
            background: copied ? '#22c55e' : 'var(--secondary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem',
            fontWeight: 600,
            transition: 'background 0.2s'
          }}
        >
          {copied ? 'Copied to Clipboard!' : 'Copy Code'}
        </button>
      </div>

      <button
        onClick={() => setView('menu')}
        style={{ width: '100%', padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}
      >
        &larr; Back to Menu
      </button>
    </div>
  );

  const renderJoin = () => (
    <div>
      <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Join Game</h2>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#666' }}>
        Enter the code shared by your friend.
      </p>

      <input
        placeholder="Enter Game Code"
        value={remoteId}
        onChange={(e) => setRemoteId(e.target.value)}
        style={{
          width: '100%',
          padding: '1rem',
          borderRadius: '12px',
          border: '2px solid #e2e8f0',
          marginBottom: '1rem',
          fontSize: '1.25rem',
          outline: 'none',
          boxSizing: 'border-box',
          textAlign: 'center',
          fontFamily: 'monospace'
        }}
      />
      <button
        onClick={handleJoin}
        disabled={status === 'connecting' || !remoteId}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: 800,
          opacity: (status === 'connecting' || !remoteId) ? 0.7 : 1,
          marginBottom: '1rem'
        }}
      >
        {status === 'connecting' ? 'Connecting...' : 'Join Game'}
      </button>

      <button
        onClick={() => setView('menu')}
        style={{ width: '100%', padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}
      >
        &larr; Back to Menu
      </button>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '4rem' }}>
      <div className="panel">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-main)', textAlign: 'center' }}>A Little Wordy</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2.5rem', textAlign: 'center', fontWeight: 500 }}>Digital Edition</p>

        {view === 'menu' && renderMenu()}
        {view === 'host' && renderHost()}
        {view === 'join' && renderJoin()}
      </div>
    </div>
  );
};
