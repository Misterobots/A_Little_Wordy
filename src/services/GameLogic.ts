
export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const CONSONANTS = [
    'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
    'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'
];



export const generateTiles = (): string[] => {
    // Standard distribution based on Scrabble-ish weights or just simple random for now
    // Let's go with a balanced set: 4 Vowels, 7 Consonants maybe? Or just random.
    // The original game usually has a mix. Let's do 4 Vowels and 8 Consonants for 12 tiles total.

    const tiles: string[] = [];

    // Add 4 random vowels
    for (let i = 0; i < 4; i++) {
        tiles.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
    }

    // Add 8 random consonants
    for (let i = 0; i < 8; i++) {
        tiles.push(CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]);
    }

    // Shuffle
    return tiles.sort(() => Math.random() - 0.5);
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
