import React from 'react';
import { useGame } from '../context/GameContext';
import { Tile } from './Tile';

import { isValidWord } from '../services/Dictionary';

export const GameBoard = () => {
    const { state, dispatch, network } = useGame();

    const [guessInput, setGuessInput] = React.useState('');

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

    const handleGuess = () => {
        if (!guessInput) return;
        if (!isValidWord(guessInput)) {
            // maybe show temporary error?
            return;
        }
        dispatch({ type: 'MAKE_GUESS', payload: { word: guessInput.toUpperCase(), player: 'ME' } });
        setGuessInput('');
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



    if (state.status === 'GAME_OVER') {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <div className="panel">
                    <h2>Game Over!</h2>
                    {state.winner === 'ME' ?
                        <h1 style={{ color: 'var(--primary)', fontSize: '3rem' }}>YOU WON!</h1> :
                        <h1 style={{ color: 'var(--text-berry)', fontSize: '3rem' }}>YOU LOST!</h1>
                    }
                    <div style={{ marginTop: '2rem' }}>
                        <p>Your Word: <strong>{state.mySecretWord}</strong></p>
                        <p>Opponent's Word: <strong>{state.opponentSecretWord || '???'}</strong></p>
                    </div>
                    <button onClick={() => window.location.reload()} style={{
                        marginTop: '2rem',
                        padding: '1rem 2rem',
                        fontSize: '1.2rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px'
                    }}>Play Again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '120px' }}> {/* Pad for fixed input */}
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem' }}>
                <div className={`panel ${state.turn === 'OPPONENT' ? 'active-turn' : ''}`} style={{ padding: '0.5rem 1rem', border: state.turn === 'OPPONENT' ? '2px solid var(--text-berry)' : '1px solid #ccc' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', display: 'block' }}>OPPONENT CLUES</span>
                    <strong style={{ fontSize: '1.5rem' }}>{state.guesses.filter(g => g.player === 'OPPONENT').length}</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: 0, color: state.turn === 'ME' ? 'var(--primary)' : 'var(--text-berry)' }}>
                        {state.turn === 'ME' ? 'YOUR TURN' : 'OPPONENT TURN'}
                    </h3>
                </div>
                <div className={`panel ${state.turn === 'ME' ? 'active-turn' : ''}`} style={{ padding: '0.5rem 1rem', border: state.turn === 'ME' ? '2px solid var(--primary)' : '1px solid #ccc' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', display: 'block' }}>YOUR CLUES</span>
                    <strong style={{ fontSize: '1.5rem' }}>{state.guesses.filter(g => g.player === 'ME').length}</strong>
                </div>
            </header>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem', letterSpacing: '1px' }}>COMMON TILES</h2>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {state.commonTiles.map((l, i) => (
                        <Tile key={i} letter={l} type={['A', 'E', 'I', 'O', 'U'].includes(l) ? 'vowel' : 'consonant'} />
                    ))}
                </div>
            </div>

            <div className="history" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {state.guesses.slice().reverse().map((g, i) => (
                    <div key={i} className="panel" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderLeft: g.player === 'ME' ? '5px solid var(--primary)' : '5px solid var(--text-berry)'
                    }}>
                        <span style={{ fontWeight: 600, color: '#333' }}>{g.word}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', color: '#666' }}>Clues:</span>
                            <span style={{ background: '#333', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{g.clues}</span>
                        </div>
                    </div>
                ))}
            </div>

            {state.turn === 'ME' && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    padding: '1rem', background: 'white', borderTop: '1px solid #eee',
                    display: 'flex', gap: '0.5rem', justifyContent: 'center'
                }}>
                    <input
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                        placeholder="Guess a word..."
                        style={{
                            padding: '1rem', fontSize: '1.2rem', borderRadius: '8px', border: '2px solid #ddd', width: '60%'
                        }}
                    />
                    <button
                        onClick={handleGuess}
                        disabled={!guessInput}
                        style={{
                            padding: '1rem', fontSize: '1.2rem', borderRadius: '8px', border: 'none',
                            background: guessInput ? 'var(--primary)' : '#ccc', color: 'white', fontWeight: 700
                        }}
                    >
                        GUESS
                    </button>
                </div>
            )}
        </div>
    );
};
