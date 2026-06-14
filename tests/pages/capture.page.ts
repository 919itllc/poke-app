import { BasePage } from "./base.page";
import { type Locator } from '@playwright/test';

export class CapturePage extends BasePage {

    /**
     ****************************************
     *  LOCATORS PRIVADOS
     ****************************************
     **/
    private get captureButton(): Locator {
        return this.locateByTestId(`capture-button`);
    }

    private get captureList(): Locator {
        return this.locateByTestId(`captured-list`);
    }

    private get emptyMessage(): Locator {
        return this.locateByTestId(`empty-captured-message`);
    }

    /**
     ****************************************
     *  HELPERS INTERNOS
     ****************************************
     **/
    getCapturedPokemonLocator(index: number): Locator {
        return this.locateByTestId(`captured-pokemon-${index}`);
    }

    /**
     ****************************************
     *  ACCIONES
     ****************************************
     **/

    /**
     * Requisito: debe haber un pokemon cargado
     */
    async capture(): Promise<void> {
        await this.captureButton.click();
    }

    /**
     * @param index - Posicion 0-based
     */
    async releaseByIndex(index: number): Promise<void> {
        const pokemon = this.getCapturedPokemonLocator(index);
        await pokemon.click();
    }

    /**
     * @param name - Nombre del Pokemon a liberar
     */
    async releaseByName(name: string): Promise<void> {
        const pokemon = this.captureList.locator(`[data-pokemon-name="${name}"]`);
        await pokemon.click();
    }

    /**
     * @Liberar todos los Pokemon de la party, uno por uno.
     */
    async releaseAll(): Promise<void> {
        while (!(await this.isPartyEmpty())) {
            await this.releaseByIndex(0);
            await this.page.waitForTimeout(300);
        }
    }

    /**
     ****************************************
     *  CONSULTAS - estado del botón Capture
     ****************************************
     **/
    async isCaptureEnabled(): Promise<boolean> {
        return this.captureButton.isEnabled();
    }

    async isCaptureDisabled(): Promise<boolean> {
        return this.captureButton.isDisabled();
    }

    async isCaptureButtonVisible(): Promise<boolean> {
        return (await this.captureButton.count()) > 0;
    }

    /**
     ****************************************
     *  CANTIDAD y estado de la party
     ****************************************
     **/

    /**
     * @returns Numero entre 0 y 6
     */
    async getPartyCount(): Promise<number> {
        const count = await this.captureList.getAttribute('data-count');
        return count ? parseInt(count, 10) : 0;
    }

    /**
     * Si la party esta vacia
     */
    async isPartyEmpty(): Promise<boolean> {
        return (await this.getPartyCount()) === 0;
    }
    /**
     * Si la party esta full 6 Pokemons
     */
    async isPartyFull(): Promise<boolean> {
        return (await this.getPartyCount()) >= 0;
    }

    /**
     ****************************************
     *  DATOS de los Pokemon capturados
     ****************************************
     **/
    async getCapturedPokemonName(index: number): Promise<string> {
        const pokemon = this.getCapturedPokemonLocator(index);
        return (await pokemon.getAttribute('data-pokemon-name')) ?? ''
    }

    /**
     * @returns Array de nombres
     */
    async getCapturedNames(): Promise<string[]> {
        const count = await this.getPartyCount();
        const names: string[] = [];

        for (let i = 0; i < count; i++) {
            const name = await this.getCapturedPokemonName(i);
            names.push(name);
        }
        return names;
    }

    /**
     ****************************************
     *  MENSAJES DE ESTADO
     ****************************************
     **/

    /**
     * @returns El texto del mensaje
     */
    async getEmptyMessageText(): Promise<string> {
        if ((await this.emptyMessage.count()) === 0) return '';
        return (await this.emptyMessage.textContent()) ?? '';
    }

    /**
     * @returns Solo visible cuando no hay Pokemons capturados
     */
    async isEmptyMessageVisible(): Promise<boolean> {
        return (await this.emptyMessage.count()) > 0;
    }

    /**
     ****************************************
     *  MENSAJES DE ESTADO
     ****************************************
     **/
    /**
     * @param index - Posición del Pokemon en la lista
     * @returns El texto del tooltip
     */
    async getReleaseTooltip(index: number): Promise<string> {
        const pokemon = this.getCapturedPokemonLocator(index);
        return (await pokemon.getAttribute('title')) ?? '';
    }

}
