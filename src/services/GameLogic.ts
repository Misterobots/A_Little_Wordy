
export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const CONSONANTS = [
    'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
    'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'
];



export const generateTiles = (): string[] => {
    // 4 Vowels, 7 Consonants = 11 Tiles
    const tiles: string[] = [];

    // Add 4 random vowels
    for (let i = 0; i < 4; i++) {
        tiles.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
    }

    // Add 7 random consonants
    for (let i = 0; i < 7; i++) {
        tiles.push(CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]);
    }

    // Shuffle
    return tiles.sort(() => Math.random() - 0.5);
};

export const canFormWord = (word: string, tiles: string[]): boolean => {
    const tileCounts = new Map<string, number>();
    for (const t of tiles) {
        tileCounts.set(t, (tileCounts.get(t) || 0) + 1);
    }

    for (const char of word.toUpperCase()) {
        const count = tileCounts.get(char);
        if (!count || count <= 0) {
            return false;
        }
        tileCounts.set(char, count - 1);
    }
    return true;
};

export const ClueType = {
    FIRST_LETTER: 'FIRST_LETTER',
    LAST_LETTER: 'LAST_LETTER',
    WORD_LENGTH: 'WORD_LENGTH',
    CONTAINS_LETTER: 'CONTAINS_LETTER'
} as const;

export type ClueType = typeof ClueType[keyof typeof ClueType];


export interface ClueCard {
    id: string;
    type: ClueType;
    cost: number;
    title: string;
    description: string;
    isSpicy: boolean;
}

export const AVAILABLE_CLUES: ClueCard[] = [
    { id: 'c1', type: ClueType.FIRST_LETTER, cost: 4, title: 'First Letter', description: 'Reveal the first letter', isSpicy: false },
    { id: 'c2', type: ClueType.LAST_LETTER, cost: 3, title: 'Last Letter', description: 'Reveal the last letter', isSpicy: false },
    { id: 'c3', type: ClueType.WORD_LENGTH, cost: 1, title: 'Word Length', description: 'Know how long the word is', isSpicy: false },
    // { id: 'c4', type: ClueType.CONTAINS_LETTER, cost: 2, title: 'Check Letter', description: 'Check if a letter is in the word', isSpicy: false }
];

export const resolveClueCard = (clue: ClueCard, secretWord: string): string => {
    switch (clue.type) {
        case ClueType.FIRST_LETTER:
            return `Starts with ${secretWord.charAt(0)}`;
        case ClueType.LAST_LETTER:
            return `Ends with ${secretWord.charAt(secretWord.length - 1)}`;
        case ClueType.WORD_LENGTH:
            return `Length is ${secretWord.length}`;
        default:
            return 'Unknown Clue';
    }
};

export const calculateClues = (secret: string, guess: string): number => {
    // Count how many letters they have in common (multiset intersection)
    const secretMap = new Map<string, number>();
    for (const char of secret) {
        secretMap.set(char, (secretMap.get(char) || 0) + 1);
    }

    let clues = 0;
    for (const char of guess) {
        if (secretMap.has(char) && secretMap.get(char)! > 0) {
            clues++;
            secretMap.set(char, secretMap.get(char)! - 1);
        }
    }
    return clues;
};
