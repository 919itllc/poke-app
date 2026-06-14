import { test, expect } from '@playwright/test';
import { SearchPage } from './pages/search.page';
import { CapturePage } from './pages/capture.page';
import { TEST_POKEMON } from './data/test-pokemon';

test.describe('Search', () => {
    let searchPage: SearchPage;
    let capturePage: CapturePage;

    test.beforeEach(async ({ page }) => {
        searchPage = new SearchPage(page);
        capturePage = new CapturePage(page);
        await searchPage.goto();
        await searchPage.waitForAppReady();
    });

    test('SEARCH-01: buscar Pokemon por nombre valido', async () => {
        await searchPage.search(TEST_POKEMON.PIKACHU.name);

        expect(await searchPage.isCardVisible()).toBe(true);
        expect(await searchPage.getPokemonName()).toBe(TEST_POKEMON.PIKACHU.name);
        expect(await searchPage.getPokemonID()).toBe(`#${TEST_POKEMON.PIKACHU.id}`);
    });

    test('SEARCH-02: buscar Pokemon por ID numerico', async () => {
        await searchPage.search(String(TEST_POKEMON.PIKACHU.id));

        expect(await searchPage.isCardVisible()).toBe(true);
        expect(await searchPage.getPokemonName()).toBe(TEST_POKEMON.PIKACHU.name);
    });

    test('SEARCH-03: buscar con mayusculas (case insensitive)', async () => {
        await searchPage.search('PIKACHU');

        expect(await searchPage.isCardVisible()).toBe(true);
        expect(await searchPage.getPokemonName()).toBe(TEST_POKEMON.PIKACHU.name);
    });

    test('SEARCH-04: buscar con espacios alrededor (trim)', async () => {
        test.fail();
        await searchPage.search('  pikachu  ');

        expect(await searchPage.isCardVisible()).toBe(true);
        expect(await searchPage.getPokemonName()).toBe(TEST_POKEMON.PIKACHU.name);
    });

    test('SEARCH-05: buscar Pokemon inexistente', async () => {
        await searchPage.search('zzz999');
        expect(await searchPage.isCardVisible()).toBe(false);
        await searchPage.waitForToast('Pokemon not found');
    });

    test('SEARCH-06: buscar con input vacio', async () => {
        await searchPage.searWithEmptyField();
        expect(await searchPage.isCardVisible()).toBe(false);
        await searchPage.waitForToast('Please enter a Pokemon name or ID');
    });

    test('SEARCH-07: buscar con caracteres especiales', async () => {
        await searchPage.search('"#$%&/()');
        expect(await searchPage.isCardVisible()).toBe(false);
        await searchPage.waitForToast('Please try another name or ID');
    });

    test('SEARCH-08: buscar presionando enter', async () => {
        await searchPage.searByClick(TEST_POKEMON.MAGIKARP.name);

        expect(await searchPage.isCardVisible()).toBe(true);
        expect(await searchPage.getPokemonName()).toBe(TEST_POKEMON.MAGIKARP.name);
        expect(await searchPage.getPokemonID()).toBe(`#${TEST_POKEMON.MAGIKARP.id}`);
    });
});
