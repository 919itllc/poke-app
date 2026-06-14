import { type Page, type Locator } from '@playwright/test';

export class BasePage {
    protected readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * baseURL va a la url de localhost
     */
    async goto(): Promise<void> {
        await this.page.goto('/');
    }

    /**
     * @param testId - El valor del atributo data-testid  
     * @returns Locator de playwrigh para ese elemento 
     */
    locateByTestId(testId: string): Locator {
        return this.page.getByTestId(testId);
    }

    localByText(text: string): Locator {
        return this.page.getByText(text);
    }

    localByRole(role: string, name?: string): Locator {
        return name ? this.page.getByRole(role as any, { name }) : this.page.getByRole(role as any);
    }

    /**
     * @param message: el texto del toast a verificar
     * @param timeout: tiempo maximo de espera en ms
     */
    async waitForToast(message: string, timeout = 5000): Promise<void> {
        const toast = this.localByText(message);
        await toast.waitFor({ state: 'visible', timeout });
        await toast.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {
            console.log('El toast no desaparecio en menos de 8 segundos.');
        });
    }

    /**
     * @param message - el texto del toast a verificar
     * @return true si el toast esta visible
     */
    async waitForToastAppear(message: string, timeout = 5000): Promise<void> {
        await this.localByText(message).waitFor({ state: 'visible', timeout });
    }

    /**
     * Espera a que la aplicación este cargada completamente 
     */
    async waitForAppReady(): Promise<void> {
        await this.locateByTestId('search-input').waitFor({ state: 'visible' });
    }

    /**
     * Sleep espera una cantidad fija de milisegundos.
     * mejor usar waitForSelector o waitForResponse
     * 
     * @param ms - milisegundos a esperar
     */
    async sleep(ms: number): Promise<void> {
        await this.page.waitForTimeout(ms);
    }

    /**
     * Guardar una foto para saber el error en debugging
     * 
     * @param name - Nombre descriptivo para la screenshot
     */

    async takeScreenshot(name: string): Promise<void> {
        await this.page.screenshot({ path: `test-result/screenshot/${name}.png`, fullPage: true });
    }
}