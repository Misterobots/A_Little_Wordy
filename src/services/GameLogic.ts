
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
