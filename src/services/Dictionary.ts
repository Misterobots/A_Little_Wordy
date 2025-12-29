// A small subset of words for demonstration/testing to keep it lightweight.
// In a real app, we might fetch a larger list or use a compressed trie.

const COMMON_WORDS = new Set([
    "apple", "beach", "brain", "bread", "brush", "chair", "chest", "chord",
    "click", "clock", "cloud", "dance", "diary", "drink", "drive", "earth",
    "feast", "field", "fruit", "glass", "grape", "green", "ghost", "guide",
    "heart", "horse", "house", "juice", "light", "lemon", "melon", "money",
    "music", "night", "party", "phone", "piano", "pilot", "pizza", "plane",
    "plate", "price", "radio", "river", "robot", "shirt", "shoe", "smile",
    "snake", "space", "spoon", "star", "stone", "sugar", "table", "toast",
    "tiger", "train", "truck", "watch", "water", "world", "write", "yacht",
    "zebra", "wordy", "game", "code", "react", "vite", "peer"
]);

export const isValidWord = (word: string): boolean => {
    return COMMON_WORDS.has(word.toLowerCase()) || word.length > 2; // Fallback for demo: accept any string > 2 chars
};

export const getRandomWord = (): string => {
    const words = Array.from(COMMON_WORDS);
    return words[Math.floor(Math.random() * words.length)].toUpperCase();
};
