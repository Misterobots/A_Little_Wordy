import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { networkManager } from '../services/NetworkManager';
import { getRandomWord } from '../services/Dictionary';
import { generateTiles, calculateClues } from '../services/GameLogic';

export type GameState = 'LOBBY' | 'SETUP' | 'PLAYING' | 'GAME_OVER';

export interface GuessEntry {
    word: string;
    clues: number;
    player: 'ME' | 'OPPONENT';
}

interface State {
    status: GameState;
    isHost: boolean;
    isVsCpu: boolean;
    mySecretWord: string;
    opponentSecretWordLength: number | null;
    opponentSecretWord: string | null; // For CPU or revealing at end
    myTiles: string[]; // Not really used in this variant, usually shared
    commonTiles: string[];
    guesses: GuessEntry[];
    turn: 'ME' | 'OPPONENT';
    winner: 'ME' | 'OPPONENT' | 'DRAW' | null;
}

type Action =
    | { type: 'SET_STATUS'; payload: GameState }
    | { type: 'SET_HOST'; payload: boolean }
    | { type: 'SET_SECRET_WORD'; payload: string }
    | { type: 'SET_OPPONENT_SECRET_LENGTH'; payload: number }
    | { type: 'START_SINGLE_PLAYER' }
    | { type: 'SET_COMMON_TILES'; payload: string[] }
    | { type: 'MAKE_GUESS'; payload: { word: string; player: 'ME' | 'OPPONENT' } }
    | { type: 'SWITCH_TURN' }
    | { type: 'GAME_OVER'; payload: 'ME' | 'OPPONENT' | 'DRAW' };

const initialState: State = {
    status: 'LOBBY',
    isHost: true,
    isVsCpu: false,
    mySecretWord: '',
    opponentSecretWordLength: null,
    opponentSecretWord: null,
    myTiles: [],
    commonTiles: [],
    guesses: [],
    turn: 'ME', // Host starts?
    winner: null
};

const GameContext = createContext<{
    state: State;
    dispatch: React.Dispatch<Action>;
    network: typeof networkManager;
    peerId: string;
} | null>(null);

const gameReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_STATUS': return { ...state, status: action.payload };
        case 'SET_HOST': return { ...state, isHost: action.payload, turn: action.payload ? 'ME' : 'OPPONENT' };
        case 'SET_SECRET_WORD': return { ...state, mySecretWord: action.payload };
        case 'SET_OPPONENT_SECRET_LENGTH': return { ...state, opponentSecretWordLength: action.payload };
        case 'START_SINGLE_PLAYER': return { ...state, status: 'SETUP', isVsCpu: true, isHost: true, opponentSecretWord: getRandomWord() }; // Pre-gen CPU word
        case 'SET_COMMON_TILES': return { ...state, commonTiles: action.payload };

        case 'MAKE_GUESS': {
            const { word, player } = action.payload;

            // Calculate clues
            let clues = 0;
            let target = '';

            if (player === 'ME') {
                // I am guessing opponent's word
                // In single player we have opponentSecretWord, in MP we might not know it directly yet?
                // Actually for MP verifying clues usually happens on the other client or via trusted host.
                // For simplicity in P2P here: Sender calculates clues locally if they know the word? 
                // OR: Sender sends guess, Receiver calculates clues and sends back result.

                // SINGLE PLAYER LOGIC:
                if (state.isVsCpu && state.opponentSecretWord) {
                    target = state.opponentSecretWord;
                }
            } else {
                // Opponent guessing my word
                target = state.mySecretWord;
            }

            if (target) {
                clues = calculateClues(target, word);
            }

            // Check win
            if (target && word === target) {
                // That player won!
                return {
                    ...state,
                    guesses: [...state.guesses, { word, clues, player }],
                    status: 'GAME_OVER',
                    winner: player
                };
            }

            return {
                ...state,
                guesses: [...state.guesses, { word, clues, player }],
                turn: player === 'ME' ? 'OPPONENT' : 'ME'
            };
        }

        case 'GAME_OVER': return { ...state, status: 'GAME_OVER', winner: action.payload };

        default: return state;
    }
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [peerId, setPeerId] = useState('');

    // Initial Setup for Single Player
    useEffect(() => {
        if (state.isVsCpu && state.status === 'SETUP' && !state.opponentSecretWordLength && state.opponentSecretWord) {
            // We set the word in the reducer for single player, just need to set the length to trigger UI
            // But wait, the previous logic was using a timeout. Let's keep it simple.
            // Reducer already set opponentSecretWord.
            dispatch({ type: 'SET_OPPONENT_SECRET_LENGTH', payload: state.opponentSecretWord.length });
        }
    }, [state.isVsCpu, state.status, state.opponentSecretWord]);

    // Generate Tiles when entering Setup
    useEffect(() => {
        if (state.status === 'SETUP' && state.commonTiles.length === 0) {
            if (state.isHost) {
                const tiles = generateTiles();
                dispatch({ type: 'SET_COMMON_TILES', payload: tiles });
                // If MP, send tiles to opponent
                networkManager.sendMessage({ type: 'GAME_DATA', payload: { action: 'SET_TILES', tiles } });
            }
        }
    }, [state.status, state.isHost]);


    // Transition to PLAYING when setup is complete
    useEffect(() => {
        if (state.status === 'SETUP' && state.mySecretWord && state.opponentSecretWordLength) {
            const timer = setTimeout(() => {
                dispatch({ type: 'SET_STATUS', payload: 'PLAYING' });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [state.status, state.mySecretWord, state.opponentSecretWordLength]);

    // MP Listeners
    useEffect(() => {
        networkManager.initialize((id) => setPeerId(id));

        networkManager.setMessageHandler((msg) => {
            if (msg.type === 'HANDSHAKE') {
                dispatch({ type: 'SET_STATUS', payload: 'SETUP' });
                dispatch({ type: 'SET_HOST', payload: true });
                networkManager.sendMessage({ type: 'HANDSHAKE_ACK', payload: {} });
            }
            if (msg.type === 'HANDSHAKE_ACK') {
                dispatch({ type: 'SET_STATUS', payload: 'SETUP' });
                dispatch({ type: 'SET_HOST', payload: false });
            }
            if (msg.type === 'GAME_DATA') {
                if (msg.payload.action === 'SET_SECRET_LENGTH') {
                    dispatch({ type: 'SET_OPPONENT_SECRET_LENGTH', payload: msg.payload.length });
                }
                if (msg.payload.action === 'SET_TILES') {
                    dispatch({ type: 'SET_COMMON_TILES', payload: msg.payload.tiles });
                }
                // TODO: Add GUESS handling for MP
            }
        });
    }, []);

    // CPU Turn Logic
    useEffect(() => {
        if (state.isVsCpu && state.status === 'PLAYING' && state.turn === 'OPPONENT') {
            const timer = setTimeout(() => {
                // CPU makes a random guess for now
                const guess = getRandomWord();
                dispatch({ type: 'MAKE_GUESS', payload: { word: guess, player: 'OPPONENT' } });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [state.isVsCpu, state.status, state.turn]);

    return (
        <GameContext.Provider value={{ state, dispatch, network: networkManager, peerId }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within GameProvider");
    return context;
};

