import { test, expect } from '@playwright/test';
import { SearchPage } from './pages/search.page';
import { CapturePage } from './pages/capture.page';
import { TEST_POKEMON } from './data/test-pokemon';
import { setupTest } from './helpers/test-setup';
import { attachHealingSuggestion } from './helpers/healing-reporter';

test.describe('Pokemon Card', () => {
    let searchPage: SearchPage;
    let capturePage: CapturePage;

    test.beforeEach(async ({ page }) => {
        ({ searchPage, capturePage } = await setupTest(page));
    });

    test.afterEach(async ({ }, testInfo) => {                             // ← NUEVO (2)
        await attachHealingSuggestion(testInfo);                         // ← NUEVO (3)
    });

    test('CARD-01: validar todos los campos de card', async () => {
        await searchPage.search(TEST_POKEMON.CHARIZARD.name);

        expect(await searchPage.isCardVisible()).toBe(true);
        expect(await searchPage.getPokemonName()).toBe(TEST_POKEMON.CHARIZARD.name);
        expect(await searchPage.getPokemonIdNumber()).toBe(TEST_POKEMON.CHARIZARD.id);

        const src = await searchPage.getSpriteSrc();
        expect(src).toBeTruthy();
        expect(src).toContain('https://');

        const types = await searchPage.getPokemonTypes();
        expect(types.length).toBe(2)
        expect(types[0]).toBe(TEST_POKEMON.CHARIZARD.types[0]);
    });

    test('CARD-02: validar que la imagen cargo correctamente', async () => {
        await searchPage.search(TEST_POKEMON.CHARIZARD.name);

        expect(await searchPage.isSpriteLoaded()).toBe(true);
        const src = await searchPage.getSpriteSrc();
        expect(src).toMatch(/^https:\/\/.*\.(png|svg|gif)/);
    });

    test('CARD-03: validar Pokemon con 2 tipos', async () => {
        await searchPage.search(TEST_POKEMON.CHARIZARD.name);

        const typeCount = await searchPage.getPokemonTypeCount();
        expect(typeCount).toBe(2);

        const types = await searchPage.getPokemonTypes();
        expect(types).toContain('fires');
        expect(types).toContain('flying');
    });

    test('CARD-04: validar las stats y sus valores', async () => {
        await searchPage.search(TEST_POKEMON.CHARIZARD.name);

        const stats = await searchPage.getAllStat();
        expect(stats.hp).toBeGreaterThan(0);
        expect(stats.attack).toBeGreaterThan(0);
        expect(stats.defense).toBeGreaterThan(0);
        expect(stats.speed).toBeGreaterThan(0);

        expect(Number.isInteger(stats.hp)).toBe(true);
        expect(Number.isInteger(stats.attack)).toBe(true);
        expect(Number.isInteger(stats.defense)).toBe(true);
        expect(Number.isInteger(stats.speed)).toBe(true);
    });
})