import React from 'react';
import { useGame } from '../context/GameContext';
import { Tile } from './Tile';

import { isValidWord } from '../services/Dictionary';

export const GameBoard = () => {
    const { state, dispatch, network } = useGame();

    // Mock data for visual testing before real logic
    const mockTiles = ['S', 'P', 'I', 'C', 'Y'];

    const [secretInput, setSecretInput] = React.useState('');
    const [error, setError] = React.useState('');

    const handleConfirmSecret = () => {
        if (secretInput.length < 3) {
            setError('Word must be at least 3 letters');
            return;
        }

        if (!isValidWord(secretInput)) {
            setError('Not a valid word');
            return;
        }

        network.sendMessage({ type: 'GAME_DATA', payload: { action: 'SET_SECRET_LENGTH', length: secretInput.length } });
        dispatch({ type: 'SET_SECRET_WORD', payload: secretInput.toUpperCase() });
    };

    if (state.status === 'SETUP') {
        if (state.mySecretWord) {
            return (
                <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <div className="panel">
                        <h2>Waiting for Opponent...</h2>
                        <p style={{ color: '#666' }}>You chose: <strong>{state.mySecretWord}</strong></p>
                    </div>
                </div>
            )
        }

        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <div className="panel">
                    <h2>Choose Your Secret Word</h2>
                    <p style={{ marginBottom: '2rem', color: '#666' }}>Enter a word for your opponent to guess.</p>

                    <input
                        value={secretInput}
                        onChange={(e) => {
                            setSecretInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''));
                            setError('');
                        }}
                        maxLength={12}
                        style={{
                            fontSize: '2rem',
                            textAlign: 'center',
                            letterSpacing: '0.5rem',
                            padding: '1rem',
                            width: '80%',
                            borderRadius: '12px',
                            border: '2px solid var(--tile-border)',
                            marginBottom: '1rem',
                            textTransform: 'uppercase'
                        }}
                    />
                    {error && <p style={{ color: 'var(--text-berry)', marginBottom: '1rem' }}>{error}</p>}

                    <button
                        onClick={handleConfirmSecret}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '1rem',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1.25rem',
                            fontWeight: 800
                        }}
                    >
                        Lock In Word
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div className="panel" style={{ padding: '0.5rem 1rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', display: 'block' }}>OPPONENT CLUES</span>
                    <strong>0</strong>
                </div>
                <div className="panel" style={{ padding: '0.5rem 1rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', display: 'block' }}>YOUR CLUES</span>
                    <strong>0</strong>
                </div>
            </header>

            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ marginBottom: '1rem', color: '#94a3b8' }}>COMMON TILES</h2>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {mockTiles.map((l, i) => (
                        <Tile key={i} letter={l} type={['A', 'E', 'I', 'O', 'U'].includes(l) ? 'vowel' : 'consonant'} />
                    ))}
                </div>
            </div>
        </div>
    );
};
