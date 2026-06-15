import { ChatOllama } from '@langchain/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { OllamaClient } from './ollama.client';

/**
 * TIPOS 
 */

/**
 * Representa un test que fallo, con su error y ubicación
 */
export interface TestFailure {
    testName: string;
    errorMessage: string;
    file: string;
    line: number;
}

/**
 * Resultado del analisis: una sugerencia para un fallo
 */
export interface HeallingSuggestion {
    failure: TestFailure;
    analysis: string;
    timestamp: string;
}

const HEALING_PROMPT = new PromptTemplate({
    template: `
    Eres un experto en automatizacion de tests con Playwright. 
    Analiza el siguiente fallo de test y sugiere como corregirlo.

    === CONTEXTO DE LA APLICACION ===
    La app es una SPA de Pokemon hecha con React + Chakra UI.
    Tiene estos atributos data-testid en los elementos:
    search-input, search-button,
    pokemon-card, pokemon-image, pokemon-name, pokemon-id,
    pokemon-type-{{index}} (ej: pokemon-type-0, pokemon-type-1),
    stat-hp, stat-attack, stat-defense, stat-speed,
    capture-button,
    captured-list (con atributo data-count),
    captured-pokemon-{{index}} (con data-pokemon-name),
    empty-captured-message

    Flujo tipico de un test:
    1. Navegar a "http://localhost:5173"
    2. Esperar que search-input sea visible (app cargada)
    3. Escribir un nombre/ID en search-input y hacer click en search-button
    4. Validar que pokemon-card aparezca con los datos del Pokemon
    5. Click en capture-button para capturar

    La app usa un proxy de Vite para evitar CORS.
    Los toasts de Chakra UI muestran mensajes como:
    "Please enter a Pokemon name or ID" (warning)
    "Pokemon not found" (error)
    "Party is full!" (warning)
    "pikachu captured!" (success)
    "pikachu released" (info)

    === FALLO A ANALIZAR ===
    Test: {testName}
    Archivo: {file}:{line}
    Error: {errorMessage}

    === INSTRUCCIONES ===
    Analiza el error y responde EXACTAMENTE con este formato:

    **Causa probable:** [1 frase explicando por que fallo]

    **Tipo de error:** [selector / timing / estado / datos / red / otro]

    **Selector problemático:** [el selector o data-testid que fallo, o "N/A" si no es de selector]

    **Solucion sugerida:** [2-3 pasos concretos para arreglarlo]
    `,
    inputVariables: ['testName', 'file', 'line', 'errorMessage'],
});

/**
 * CLASE PRINCIPAL
 */
export class AutoHealing {
    private readonly ollamaClient: OllamaClient;
    private chatModel: ChatOllama | null = null;
    private failures: TestFailure[] = [];
    private suggestions: HeallingSuggestion[] = [];

    constructor(ollamaClient: OllamaClient) {
        this.ollamaClient = ollamaClient;
    }

    /**
     * INICIALIZACIÓN
     */

    /**
     * Inciializa el modelo de LangChain (Ollama)
     * Debe llamarse antes de analyzeFailures() si se queire usar LangChain
     * @throws Error si el modelo no está disponible
     */
    async initialize(): Promise<void> {
        const available = await this.ollamaClient.isAvailableLLM();

        if (!available) {
            throw new Error(
                `Ollama no esta disponible o el modelo "${this.ollamaClient.getModel()}" no esta instalado. \n` +
                `Ejecuta: ollama pull ${this.ollamaClient.getModel()}`
            );
        }

        this.chatModel = new ChatOllama({
            model: this.ollamaClient.getModel(),
            temperature: this.ollamaClient.getTemperature(),
            baseUrl: this.ollamaClient.getBaseUrl(),
        });

        console.log(`[Autohealing] Modelo "${this.ollamaClient.getModel()}" inicializado via LangChain`);
    }

    /**
     * ACUMULACIÓN DE FALLOS
     */
    addFailure(failure: TestFailure): void {
        this.failures.push(failure);
    }

    getFailureCount(): number {
        return this.failures.length;
    }

    getFailures(): TestFailure[] {
        return [...this.failures];
    }

    /**
     * ANALISIS
     */

    /**
     * Analiza UN fallo individual usando Ollama.
     * Intenta primero con langchain (ChatOllama). Si falla, usa el cliente HTTP directo como fallback.
     * 
     * @param failure - El fallo a ANALIZAR
     * @returns La sugerencia con el análisis del LLM
     */
    async analyzeFailure(failure: TestFailure): Promise<HeallingSuggestion> {
        const promptText = await HEALING_PROMPT.format({
            testName: failure.testName,
            file: failure.file,
            line: String(failure.line),
            errorMessage: failure.errorMessage,
        });

        let analysis: string;

        try {
            if (this.chatModel) {
                // Camino feliz: usar langchain ChatOllama
                const response = await this.chatModel.invoke(promptText);
                analysis = typeof response.content === 'string'
                    ? response.content
                    : JSON.stringify(response.content);
            } else {
                // Fallback: cliente HTTP directo
                analysis = await this.ollamaClient.generate(promptText);
            }
        } catch (error) {
            analysis = `[ERROR] No se pudo analizar: ${error instanceof Error ? error.message : String(error)}`;
        }

        return {
            failure,
            analysis,
            timestamp: new Date().toISOString(),
        }
    }

    /**
     * Analiza TODOS los fallos acumulados y guarda las sugerencias.
     * Se llama una sola vez después de haber agregado todos los fallos. 
     * 
     * @returns Array de sugerencias, una por cada fallo
     */

    async analyzeAllFailures(): Promise<HeallingSuggestion[]> {
        if (this.getFailureCount() === 0) {
            console.log('[AutoHealing] No hay fallos para analizar');
            return [];
        }

        console.log(`[AutoHealing] Analizando ${this.getFailureCount()} fallo(s)...`);

        const suggestions: HeallingSuggestion[] = [];

        for (const failure of this.failures) {
            console.log(`[Autohealing] - ${failure.testName}`);
            const suggestion = await this.analyzeFailure(failure);
            suggestions.push(suggestion);
        }

        this.suggestions = suggestions;
        console.log(`[AutoHealing] Analisis completado. ${suggestions.length} sugerencia(s) generada(s)`);

        return suggestions;
    }

    /** GENERACIÓN DE REPORTE */

    /**
     * Genera un reporte en formato markdown con todas las sugerencias.
     * Listo para guardar como archivo .md o mostrar en consola.
     *
     * @returns String con el contenido del reporte en markdown
     */

    generateReport(): string {
        if (this.suggestions.length === 0 && this.getFailureCount() === 0) {
            return '# Auto-Healing Report\n\nNo hay fallos para analizar. \n';
        }

        if (this.suggestions.length === 0) {
            return '# Auto-Healing Report\n\nFallos pendientes de analisis. Ejecuta analyzeAllFailures() primero\n';
        }

        const lines: string[] = [
            '# Auto-Healing Report',
            '',
            `**Generado:** ${new Date().toISOString()}`,
            `**Fallos analizados:** ${this.suggestions.length}`,
            '',
            '---',
            '',
        ];

        for (let i = 0; i < this.suggestions.length; i++) {
            const s = this.suggestions[i];
            lines.push(`## ${i + 1}. ${s.failure.testName}`);
            lines.push('');
            lines.push(`- *Archivo:** \`${s.failure.file}:${s.failure.line}\``);
            lines.push(`- *Error:** \`${s.failure.errorMessage}\``);
            lines.push('');
            lines.push(s.analysis);
            lines.push('');
            lines.push(`---`);
            lines.push('');
        }

        return lines.join('\n');
    }
}