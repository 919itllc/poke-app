
export interface PokemonTestData {
    id: number;
    name: string;
    types: string[];
    hasMultipleTypes: boolean;
}

export const TEST_POKEMON = {
    PIKACHU: {
        id: 25,
        name: 'pikachu',
        types: ['electric'],
        hasMultipleTypes: false,
    },
    CHARIZARD: {
        id: 6,
        name: 'charizard',
        types: ['fire', 'flying'],
        hasMultipleTypes: true,
    },
    BULBASAUR: {
        id: 1,
        name: 'bulbasaur',
        types: ['grass', 'poison'],
        hasMultipleTypes: true,
    },
    GENGAR: {
        id: 94,
        name: 'gengar',
        types: ['ghost', 'poison'],
        hasMultipleTypes: true,
    },
    MAGIKARP: {
        id: 129,
        name: 'magikarp',
        types: ['water'],
        hasMultipleTypes: false,
    },
} as const satisfies Record<string, PokemonTestData>;