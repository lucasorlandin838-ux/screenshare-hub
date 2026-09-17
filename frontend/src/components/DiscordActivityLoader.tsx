import React from 'react';

interface Props {
  error?: string | null;
}

export default function DiscordActivityLoader({ error }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#09090b',
        color: 'white',
        fontFamily: 'sans-serif',
        gap: 20,
        padding: 24,
      }}
    >
      <div style={{ fontSize: 52 }}>🖥️</div>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>ScreenShare Hub</div>

      {error ? (
        <>
          <div style={{ color: '#f87171', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
            ⚠️ {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '10px 24px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Tentar Novamente
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              width: 40,
              height: 40,
              border: '4px solid #3f3f46',
              borderTop: '4px solid #6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div style={{ fontSize: 13, color: '#a1a1aa' }}>Conectando ao Discord...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}
