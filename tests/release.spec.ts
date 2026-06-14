import { test, expect } from '@playwright/test';
import { SearchPage } from './pages/search.page';
import { CapturePage } from './pages/capture.page';
import { TEST_POKEMON } from './data/test-pokemon';
import { setupTest } from './helpers/test-setup';

test.describe('Release', () => {
    let searchPage: SearchPage;
    let capturePage: CapturePage;

    test.beforeEach(async ({ page }) => {
        ({ searchPage, capturePage } = await setupTest(page));
    });

    test('RELEASE-01: liberar el unico pokemon liberado', async () => {
        await searchPage.search(TEST_POKEMON.PIKACHU.name);
        await capturePage.capture();

        expect(await capturePage.getPartyCount()).toBe(1);

        await capturePage.releaseByIndex(0);

        expect(await capturePage.getPartyCount()).toBe(0);
        expect(await capturePage.isPartyEmpty()).toBe(true);
        expect(await capturePage.isEmptyMessageVisible()).toBe(true);

        await searchPage.waitForToast('pikachu released');
    });

    test('RELEASE-02: liberar un Pokemon del medio y verificar el orden', async () => {
        test.fail();
        const pikachuName = TEST_POKEMON.PIKACHU.name;
        const bulbasaurName = TEST_POKEMON.BULBASAUR.name;
        const charizardName = TEST_POKEMON.CHARIZARD.name;


        await searchPage.search(pikachuName);
        await capturePage.capture();

        await searchPage.search(bulbasaurName);
        await capturePage.capture();

        await searchPage.search(charizardName);
        await capturePage.capture();

        expect(await capturePage.getPartyCount()).toBe(3);

        await capturePage.releaseByIndex(1);

        expect(await capturePage.getPartyCount()).toBe(2);

        const names = await capturePage.getCapturedNames();
        expect(names).toEqual([pikachuName, charizardName]);
    });

    test('RELEASE-03: liberar todos los Pokemon y verificar mensaje de lista vacia', async () => {
        const pokemons = [TEST_POKEMON.PIKACHU, TEST_POKEMON.CHARIZARD, TEST_POKEMON.BULBASAUR];

        for (const pokemon of pokemons) {
            await searchPage.search(pokemon.name);
            await capturePage.capture();
        }

        await capturePage.releaseAll();

        expect(await capturePage.getPartyCount()).toBe(0);
        expect(await capturePage.isPartyEmpty()).toBe(true);

        const emptyText = await capturePage.getEmptyMessageText();
        expect(emptyText).toContain('Captured Pokemon will appear here');
    });

    test('RELEASE-04: boton Capture se re-habilita al liberar la party llena', async () => {
        await searchPage.search(TEST_POKEMON.PIKACHU.name);
        for (let i = 0; i < 6; i++) {
            await capturePage.capture();
        }

        expect(await capturePage.isCaptureDisabled()).toBe(true);

        await capturePage.releaseByIndex(0);
        expect(await capturePage.getPartyCount()).toBe(5);
        expect(await capturePage.isCaptureEnabled()).toBe(true);
    });
});