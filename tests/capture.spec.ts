import { test, expect } from '@playwright/test';
import { SearchPage } from './pages/search.page';
import { CapturePage } from './pages/capture.page';
import { TEST_POKEMON } from './data/test-pokemon';

test.describe('Capture', () => {
    let searchPage: SearchPage;
    let capturePage: CapturePage;

    test.beforeEach(async ({ page }) => {
        searchPage = new SearchPage(page);
        capturePage = new CapturePage(page);
        await searchPage.goto();
        await searchPage.waitForAppReady();
    });

    test('CAPTURE-01: capturar un Pokemon', async () => {
        const pokemonName = TEST_POKEMON.PIKACHU.name;
        await searchPage.search(pokemonName);
        await capturePage.capture();

        expect(await capturePage.getPartyCount()).toBe(1);
        expect(await capturePage.isPartyEmpty()).toBe(false);

        const names = await capturePage.getCapturedNames();
        expect(names).toContain(pokemonName);

        await searchPage.waitForToast(`${pokemonName} captured!`);
    });

    test('CAPTURE-02: capturar el mismo Pokemon dos veces (duplicado permitido)', async () => {
        const pokemonName = TEST_POKEMON.PIKACHU.name;
        await searchPage.search(pokemonName);
        await capturePage.capture();
        await capturePage.capture();

        expect(await capturePage.getPartyCount()).toBe(2);
        expect(await capturePage.getCapturedPokemonName(0)).toBe(pokemonName);
        expect(await capturePage.getCapturedPokemonName(1)).toBe(pokemonName);
    });

    test('CAPTURE-3: capturar maximo 6 Pokemon', async () => {
        const pokemons = [
            TEST_POKEMON.PIKACHU.name,
            TEST_POKEMON.CHARIZARD.name,
            TEST_POKEMON.BULBASAUR.name,
            TEST_POKEMON.GENGAR.name,
            TEST_POKEMON.MAGIKARP.name,
            'eevee'
        ];
        for (const name of pokemons) {
            await searchPage.cleanSearch();
            await searchPage.search(name);
            await capturePage.capture();
        }

        expect(await capturePage.getPartyCount()).toBe(6);
        expect(await capturePage.getPartyCount()).toBeGreaterThanOrEqual(6);
        expect(await capturePage.isCaptureDisabled()).toBe(true);
    });

    test('CAPTURE-4: intentar capturar con la party llena', async () => {
        const pokemonName = TEST_POKEMON.PIKACHU.name;
        await searchPage.search(pokemonName);

        for (let i = 0; i < 6; i++) {
            await capturePage.capture();
        }

        expect(await capturePage.isCaptureDisabled()).toBe(true);
        expect(await capturePage.getPartyCount()).toBe(6);
    });

    test('CAPTURE-5: boton Capture no existe sin busqueda previa', async () => {
        expect(await capturePage.isCaptureButtonVisible()).toBe(false);
    });
});