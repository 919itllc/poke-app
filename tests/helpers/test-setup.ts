import { type Page } from '@playwright/test';
import { SearchPage } from '../pages/search.page';
import { CapturePage } from '../pages/capture.page';

export async function setupTest(page: Page): Promise<{
    searchPage: SearchPage;
    capturePage: CapturePage;
}> {
    const searchPage = new SearchPage(page);
    const capturePage = new CapturePage(page);
    await searchPage.goto();
    await searchPage.waitForAppReady();
    return { searchPage, capturePage }
}