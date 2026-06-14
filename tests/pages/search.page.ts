import { BasePage } from "./base.page";
import { type Locator } from '@playwright/test';

export class SearchPage extends BasePage {

    /**
     ****************************************
     *  LOCATORS PRIVADOS
     ****************************************
     * */
    private get searchInput(): Locator {
        return this.locateByTestId('search-input');
    }

    private get searchButton(): Locator {
        return this.locateByTestId('search-button');
    }

    private get pokemonCard(): Locator {
        return this.locateByTestId('pokemon-card');
    }

    private get pokemonImage(): Locator {
        return this.locateByTestId('pokemon-image');
    }

    private get pokemonName(): Locator {
        return this.locateByTestId('pokemon-name');
    }

    private get pokemonId(): Locator {
        return this.locateByTestId('pokemon-id');
    }

    /**
     ****************************************
     *  ACCIONES DE BUSQUEDA
     ****************************************
     * */
    async search(query: string): Promise<void> {
        await this.searchInput.clear();
        await this.searchInput.fill(query);
        await this.searchButton.click();

        await Promise.race([
            this.page.getByTestId('pokemon-card').waitFor({ state: 'visible', timeout: 10000 }).catch(() => { }),
            this.page.getByText('Pokemon not found').waitFor({ state: 'visible', timeout: 10000 }).catch(() => { }),
            this.page.getByText('Please enter a Pokemon name or ID').waitFor({ state: 'visible', timeout: 10000 }).catch(() => { }),
        ]);
    }

    async searByClick(query: string): Promise<void> {
        await this.searchInput.clear();
        await this.searchInput.fill(query);
        await this.searchInput.press('Enter');

        await Promise.race([
            this.page.getByTestId('pokemon-card').waitFor({ state: 'visible', timeout: 10000 }).catch(() => { }),
            this.page.getByText('Pokemon not found').waitFor({ state: 'visible', timeout: 10000 }).catch(() => { }),
            this.page.getByText('Please enter a Pokemon name or ID').waitFor({ state: 'visible', timeout: 10000 }).catch(() => { }),
        ]);
    }

    async searWithEmptyField(): Promise<void> {
        await this.searchInput.clear();
        await this.searchButton.click();
    }

    async cleanSearch(): Promise<void> {
        await this.searchInput.clear();
    }

    /**
     ****************************************
     *  CONSULTAS Y VISIBILIDAD 
     ****************************************
     * */

    /**
     * Verficamos si la busqueda creo la card.
     * @returns True si el pokemon card esta visible.
     */
    async isCardVisible(): Promise<boolean> {
        return (await this.pokemonCard.count()) > 0;
    }

    /**
     ****************************************
     *  CONSULTAS - DATOS DEL POKEMON 
     ****************************************
     * */

    /**
     * @return El nombre del pokemon en minusculas
     */
    async getPokemonName(): Promise<string> {
        return (await this.pokemonName.textContent()) ?? '';
    }

    /**
     * @return El id del pomekon
     */
    async getPokemonID(): Promise<string> {
        return (await this.pokemonId.textContent()) ?? '';
    }

    /**
     * @return El id del pomekon con un #
     */
    async getPokemonIdNumber(): Promise<number> {
        const idText = await this.getPokemonID();
        return parseInt(idText.replace('#', ''), 10);
    }

    /**
     * @return Array de strings con los tipos ['electric'], ['fire', 'flying']
     */
    async getPokemonTypes(): Promise<string[]> {
        const types: string[] = [];
        let index = 0;

        while (true) {
            const badge = this.locateByTestId(`pokemon-type-${index}`);
            if ((await badge.count()) === 0) break;
            const text = await badge.textContent();
            if (text) types.push(text);
            index++;
        }
        return types;
    }

    /**
     * @return Número de tipos (1 o 2 tipicamente)
     */
    async getPokemonTypeCount(): Promise<number> {
        const types = await this.getPokemonTypes();
        return types.length;
    }

    /**
     * @param statName - Nombre del stat (HP, Attack, Defense, Speed)
     * @return valor numerico del stat o 0 en caso de no tener.
     */
    async getStat(statName: string): Promise<number> {
        const statElement = this.locateByTestId(`stat-${statName}`);
        if ((await statElement.count()) === 0) return 0;
        const text = await statElement.textContent();
        return text ? parseInt(text, 10) : 0;
    }

    /**
     * @return Objeto con los 4 stats
     */
    async getAllStat(): Promise<{
        hp: number;
        attack: number;
        defense: number;
        speed: number
    }> {
        const [hp, attack, defense, speed] = await Promise.all([
            this.getStat('hp'),
            this.getStat('attack'),
            this.getStat('defense'),
            this.getStat('speed'),
        ])
        return { hp, attack, defense, speed }
    }

    /**
     * @returns true si la imagen tiene una URL valida
     */
    async getSpriteSrc(): Promise<string> {
        return (await this.pokemonImage.getAttribute('src')) ?? '';
    }

    /**
     * @return true si la imagen tiene una url valida
     */
    async isSpriteLoaded(): Promise<boolean> {
        const src = await this.getSpriteSrc();
        return src != '' && src != null;
    }

    /**
     ****************************************
     *  CONSULTAS - MENSAJES Y ESTADOS
     ****************************************
     * */

    /**
     * @return El texto del mensaje de estado vacio 
     */
    async getEmptyStateMessage(): Promise<string> {
        const emptyMessage = this.localByText('Search for a Pokemon to begin');
        if ((await emptyMessage.count()) === 0) return '';
        return (await emptyMessage.textContent()) ?? '';
    }

    /**
     * @return El texto actual en el input
     */
    async getInputValue(): Promise<string> {
        return (await this.searchInput.inputValue()) ?? '';
    }

}