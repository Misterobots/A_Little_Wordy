import React from 'react';
import { useGame } from '../context/GameContext';
import { Tile } from './Tile';

import { isValidWord } from '../services/Dictionary';
import { canFormWord, AVAILABLE_CLUES } from '../services/GameLogic';

export const GameBoard = () => {
    const { state, dispatch, network } = useGame();

    const [guessInput, setGuessInput] = React.useState('');
    const [showClueShop, setShowClueShop] = React.useState(false);

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

        // Validate that the word can be formed from MY tiles
        if (!canFormWord(secretInput, state.myTiles)) {
            setError('Must use your tiles!');
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
                    <p style={{ marginBottom: '2rem', color: '#666' }}>Enter a word for your opponent to guess using these tiles.</p>

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

                    <div style={{ marginTop: '2rem' }}>
                        <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.5rem' }}>YOUR TILES</p>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {state.myTiles.map((l, i) => (
                                <Tile key={i} letter={l} type={['A', 'E', 'I', 'O', 'U'].includes(l) ? 'vowel' : 'consonant'} />
                            ))}
                        </div>
                    </div>
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
                        <hr />
                        <p>Your Berries: <strong>{state.myBerries}</strong></p>
                        <p>Opponent Berries: <strong>{state.opponentBerries}</strong></p>
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
        <div className="container" style={{ paddingBottom: '160px' }}>
            {/* HEADER: Berries & Clues */}
            <header style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', marginBottom: '1rem', padding: '0.5rem' }}>
                <div className="panel" style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>OPPONENT</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--text-berry)' }}>🫐 {state.opponentBerries}</strong>
                    <div style={{ fontSize: '0.8rem' }}>Clues: {state.guesses.filter(g => g.player === 'OPPONENT').length}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: 0, color: state.turn === 'ME' ? 'var(--primary)' : 'var(--text-berry)' }}>
                        {state.turn === 'ME' ? 'YOUR TURN' : 'OPPONENT'}
                    </h3>
                </div>

                <div className="panel" style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>YOU</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>🫐 {state.myBerries}</strong>
                    <div style={{ fontSize: '0.8rem' }}>Clues: {state.guesses.filter(g => g.player === 'ME').length}</div>
                </div>
            </header>

            {/* ACTION AREA: Tiles & Active Clues */}
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h2 style={{ marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', letterSpacing: '1px' }}>
                    OPPONENT'S TILES
                </h2>
                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {state.opponentTiles.map((l, i) => (
                        <Tile key={i} letter={l} type={['A', 'E', 'I', 'O', 'U'].includes(l) ? 'vowel' : 'consonant'} />
                    ))}
                </div>

                {/* Active Clues Display */}
                {state.activeClues.filter(c => c.player === 'ME').length > 0 && (
                    <div style={{ textAlign: 'left', background: '#ffe4e6', padding: '0.5rem', borderRadius: '8px', border: '1px solid #fda4af' }}>
                        <strong style={{ color: '#be123c', fontSize: '0.8rem' }}>REVEALED HINTS:</strong>
                        <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, fontSize: '0.9rem', color: '#881337' }}>
                            {state.activeClues.filter(c => c.player === 'ME').map((c, i) => (
                                <li key={i}>{c.result}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* HISTORY */}
            <div className="history" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                {state.guesses.slice().reverse().map((g, i) => (
                    <div key={i} className="panel" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderLeft: g.player === 'ME' ? '5px solid var(--primary)' : '5px solid var(--text-berry)',
                        padding: '0.75rem'
                    }}>
                        <span style={{ fontWeight: 600, color: '#333' }}>{g.word}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Show Win status for history entry if matches */}
                            {(state.isVsCpu && g.word === state.opponentSecretWord) ?
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'green' }}>CORRECT!</span> :
                                <span style={{ background: '#333', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{g.clues}</span>
                            }
                        </div>
                    </div>
                ))}
            </div>

            {/* CONTROLS */}
            {state.turn === 'ME' && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    padding: '1rem', background: 'white', borderTop: '1px solid #eee',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            value={guessInput}
                            onChange={(e) => setGuessInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                            placeholder="Guess word..."
                            style={{
                                padding: '1rem', fontSize: '1.2rem', borderRadius: '8px', border: '2px solid #ddd', flex: 1
                            }}
                        />
                        <button
                            onClick={handleGuess}
                            disabled={!guessInput}
                            style={{
                                padding: '1rem', fontSize: '1.1rem', borderRadius: '8px', border: 'none',
                                background: guessInput ? 'var(--primary)' : '#ccc', color: 'white', fontWeight: 700
                            }}
                        >
                            GUESS
                        </button>
                    </div>
                    <button
                        onClick={() => setShowClueShop(true)}
                        style={{
                            padding: '0.8rem', fontSize: '1rem', borderRadius: '8px',
                            background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 600
                        }}
                    >
                        Buy Clue (Give Berries)
                    </button>
                </div>
            )}

            {/* CLUE SHOP MODAL */}
            {showClueShop && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="panel" style={{ width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Clue Shop</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                            Buying a clue gives your opponent <strong>Berry Tokens</strong>.
                            To win, you must guess the word AND have more berries than them!
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {AVAILABLE_CLUES.map(clue => {
                                const alreadyBought = state.activeClues.some(c => c.player === 'ME' && c.clueId === clue.id);
                                return (
                                    <button
                                        key={clue.id}
                                        disabled={alreadyBought}
                                        onClick={() => {
                                            dispatch({ type: 'BUY_CLUE', payload: { clue, player: 'ME' } });
                                            setShowClueShop(false);
                                        }}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '1rem', borderRadius: '8px', border: '1px solid #ddd',
                                            background: alreadyBought ? '#f1f5f9' : 'white',
                                            opacity: alreadyBought ? 0.6 : 1
                                        }}
                                    >
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 700 }}>{clue.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{clue.description}</div>
                                        </div>
                                        <div style={{
                                            background: 'var(--text-berry)', color: 'white',
                                            padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: 700
                                        }}>
                                            {clue.cost} 🫐
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setShowClueShop(false)}
                            style={{
                                marginTop: '1.5rem', width: '100%', padding: '1rem',
                                background: '#334155', color: 'white', border: 'none', borderRadius: '8px'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
