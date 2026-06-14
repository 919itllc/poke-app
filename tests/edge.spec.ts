import { test, expect } from '@playwright/test';
import { SearchPage } from './pages/search.page';
import { CapturePage } from './pages/capture.page';
import { TEST_POKEMON } from './data/test-pokemon';
import { setupTest } from './helpers/test-setup';

test.describe('Edge Cases', () => {
    let searchPage: SearchPage;
    let capturePage: CapturePage;

    test.beforeEach(async ({ page }) => {
        ({ searchPage, capturePage } = await setupTest(page));
    });

    test('EDGE-01: busquedas rapidas consecutivas no rompen la app', async () => {
        await searchPage.search(TEST_POKEMON.PIKACHU.name);
        await searchPage.search(TEST_POKEMON.CHARIZARD.name);
        await searchPage.search(TEST_POKEMON.BULBASAUR.name);

        await searchPage.sleep(1000);

        expect(await searchPage.isCardVisible()).toBe(true);
        expect(await searchPage.getPokemonName()).toBe(TEST_POKEMON.BULBASAUR.name);
    });

    test('EDGE-02: simular fallo de red de la PokeAPI', async ({ page }) => {
        await page.route('/api/pokemon/**', (route) => {
            route.fulfill({
                status: 500,
                contentType: 'text/plain',
                body: 'Internal Server Error',
            });
        });

        await searchPage.search(TEST_POKEMON.PIKACHU.name);

        expect(await searchPage.isCardVisible()).toBe(false);
        await searchPage.waitForToast('Pokemon not found');
    });

    test('EDGE-03: buscar con ID 0', async () => {
        await searchPage.search('0');

        expect(await searchPage.isCardVisible()).toBe(false);
        await searchPage.waitForToast('Pokemon not found');
    });

    test('EDGE-04: buscar con ID muy alto', async () => {
        await searchPage.search('99999');

        expect(await searchPage.isCardVisible()).toBe(false);
        await searchPage.waitForToast('Pokemon not found');
    });
});