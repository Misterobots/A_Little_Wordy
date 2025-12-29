import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { networkManager } from '../services/NetworkManager';
import { getRandomWord } from '../services/Dictionary';

export type GameState = 'LOBBY' | 'SETUP' | 'PLAYING' | 'GAME_OVER';

interface State {
    status: GameState;
    isHost: boolean;
    isVsCpu: boolean;
    mySecretWord: string;
    opponentSecretWordLength: number | null;
    myTiles: string[];
    opponentTiles: string[];
    history: any[];
}

type Action =
    | { type: 'SET_STATUS'; payload: GameState }
    | { type: 'SET_HOST'; payload: boolean }
    | { type: 'SET_SECRET_WORD'; payload: string }
    | { type: 'SET_OPPONENT_SECRET_LENGTH'; payload: number }
    | { type: 'START_SINGLE_PLAYER' };

const initialState: State = {
    status: 'LOBBY',
    isHost: true, // You are effectively the host in single player
    isVsCpu: false,
    mySecretWord: '',
    opponentSecretWordLength: null,
    myTiles: [],
    opponentTiles: [],
    history: []
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
        case 'SET_HOST': return { ...state, isHost: action.payload };
        case 'SET_SECRET_WORD': return { ...state, mySecretWord: action.payload };
        case 'SET_OPPONENT_SECRET_LENGTH': return { ...state, opponentSecretWordLength: action.payload };
        case 'START_SINGLE_PLAYER': return { ...state, status: 'SETUP', isVsCpu: true, isHost: true };
        default: return state;
    }
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [peerId, setPeerId] = useState('');

    // CPU Logic: Setup Phase
    useEffect(() => {
        if (state.isVsCpu && state.status === 'SETUP' && !state.opponentSecretWordLength) {
            const timer = setTimeout(() => {
                const cpuWord = getRandomWord();
                dispatch({ type: 'SET_OPPONENT_SECRET_LENGTH', payload: cpuWord.length });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [state.isVsCpu, state.status, state.opponentSecretWordLength]);

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
            }
        });
    }, []);

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
