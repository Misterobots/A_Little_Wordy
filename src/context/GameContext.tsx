import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { networkManager } from '../services/NetworkManager';
import { getRandomWord } from '../services/Dictionary';
import { generateTiles, calculateClues, VOWELS, CONSONANTS } from '../services/GameLogic';

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
    opponentTiles: string[];
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
    | { type: 'SET_MY_TILES'; payload: string[] }
    | { type: 'SET_OPPONENT_TILES'; payload: string[] }
    | { type: 'SET_OPPONENT_SECRET_WORD_INTERNAL'; payload: string }
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
    opponentTiles: [], // Tiles we RECEIVED from opponent (to guess with)
    commonTiles: [], // deprecated
    guesses: [],
    turn: 'ME',
    winner: null
};

/* ... skip to listener ... */



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
        case 'START_SINGLE_PLAYER': return { ...state, status: 'SETUP', isVsCpu: true, isHost: true };
        case 'SET_MY_TILES': return { ...state, myTiles: action.payload };
        case 'SET_OPPONENT_TILES': return { ...state, opponentTiles: action.payload };
        case 'SET_OPPONENT_SECRET_WORD_INTERNAL': return { ...state, opponentSecretWord: action.payload };

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
            // Reducer already set opponentSecretWord.
            dispatch({ type: 'SET_OPPONENT_SECRET_LENGTH', payload: state.opponentSecretWord.length });
        }
    }, [state.isVsCpu, state.status, state.opponentSecretWord]);

    // Generate Tiles when entering Setup (Single Player)
    useEffect(() => {
        if (state.status === 'SETUP' && state.myTiles.length === 0 && state.isVsCpu) {
            // 1. Generate Player Tiles
            const myTiles = generateTiles();

            // 2. Generate CPU Word & Tiles
            // CPU needs a valid word that fits in 4V/7C structure
            // Simplified approach: Pick a word first, then ensure tiles exist
            let cpuWord = getRandomWord();
            while (cpuWord.length > 7) { // mild constraint to make it easier to fit
                cpuWord = getRandomWord();
            }

            // Construct CPU tiles: ensure they contain the word
            const cpuTiles: string[] = [];


            // Add word letters
            let vCount = 0;
            let cCount = 0;

            for (const char of cpuWord) {
                cpuTiles.push(char);
                if (['A', 'E', 'I', 'O', 'U'].includes(char)) vCount++;
                else cCount++;
            }

            // Fill remainder
            while (vCount < 4) {
                cpuTiles.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
                vCount++;
            }
            while (cCount < 7) {
                cpuTiles.push(CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]);
                cCount++;
            }

            // If word was heavy on vowels/consonants we might have > 4 or > 7
            // This is "good enough" for v1 - the constraint is 11 tiles total mostly
            // Truncate or Fill to strictly 11 if needed? 
            // Let's just shuffle and set.

            dispatch({ type: 'SET_MY_TILES', payload: myTiles });
            dispatch({ type: 'SET_OPPONENT_TILES', payload: cpuTiles.sort(() => Math.random() - 0.5) });

            // Set CPU word
            // We need to set this in state so we can check win condition later
            // BUT we also need to set the length for the UI
            dispatch({ type: 'SET_OPPONENT_SECRET_WORD_INTERNAL', payload: cpuWord });
            dispatch({ type: 'SET_OPPONENT_SECRET_LENGTH', payload: cpuWord.length });
        }
    }, [state.status, state.myTiles, state.isVsCpu]);


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
                    dispatch({ type: 'SET_OPPONENT_TILES', payload: msg.payload.tiles });
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

