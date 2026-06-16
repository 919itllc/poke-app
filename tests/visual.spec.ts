import { test, expect } from '@playwright/test';
import { SearchPage } from './pages/search.page';
import { CapturePage } from './pages/capture.page';
import { TEST_POKEMON } from './data/test-pokemon';
import { setupTest } from './helpers/test-setup';

test.describe('Visual Regression', () => {
    let searchPage: SearchPage;
    let capturePage: CapturePage;

    test.beforeEach(async ({ page }) => {
        ({ searchPage, capturePage } = await setupTest(page));
    });

    test('VISUAL-01: pagina inicial sin busqueda', async ({ page }) => {
        await expect(page).toHaveScreenshot('01-homepage.png', {
            fullPage: true,
        });
    });

    test('VISUAL-02: card con Pokemon de 1 tipo', async ({ page }) => {
        await searchPage.search(TEST_POKEMON.PIKACHU.name);
        await expect(page).toHaveScreenshot('02-pikachu-card.png', {
            fullPage: true,
        });
    });

    test('VISUAL-03: card con Pokemon de 2 tipos', async ({ page }) => {
        await searchPage.search(TEST_POKEMON.CHARIZARD.name);
        await expect(page).toHaveScreenshot('03-charizard-card.png', {
            fullPage: true,
        });
    });

    test('VISUAL-04: lista de capturados con Pokemon', async ({ page }) => {
        await searchPage.search(TEST_POKEMON.PIKACHU.name);
        await capturePage.capture();

        await searchPage.search(TEST_POKEMON.CHARIZARD.name);
        await capturePage.capture();

        await searchPage.search(TEST_POKEMON.BULBASAUR.name);
        await capturePage.capture();

        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('04-captured-list.png', {
            fullPage: true,
        });
    });

    test('VISUAL-05: lista de capturados vacia', async ({ page }) => {
        await expect(page).toHaveScreenshot('05-empty-capture.png', {
            fullPage: true,
        });
    });

    test('VISUAL-06: toast de captura exitosa', async ({ page }) => {
        await searchPage.search(TEST_POKEMON.PIKACHU.name);
        await capturePage.capture();

        await expect(page).toHaveScreenshot('06-toast-success.png', {
            fullPage: true,
        });
    });

    test('VISUAL-07: boton Capture deshabilitado', async ({ page }) => {
        // Capturamos 6 pikachus para llenar la party
        await searchPage.search(TEST_POKEMON.PIKACHU.name);
        for (let i = 0; i < 6; i++) {
            await capturePage.capture();
        }

        await expect(page).toHaveScreenshot('07-capture-disabled.png', {
            fullPage: true,
        });
    });

    test('VISUAL-08: responsive mobile', async ({ page }) => {
        // Cambiamos el viewport a tamaño de iPhone
        await page.setViewportSize({ width: 375, height: 812 });

        await searchPage.search(TEST_POKEMON.PIKACHU.name);

        await expect(page).toHaveScreenshot('08-mobile.png', {
            fullPage: true,
        });
    });
}); 