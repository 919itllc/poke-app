import type { TestInfo } from '@playwright/test';
import { OllamaClient } from './ollama.client';
import { AutoHealing } from './auto-healing';

/**
 * Inicializado lazy: la primera vez que se llama al hook.
 * Usamos una variable a nivel de modulo para no crear un nuevo
 * cliente de Ollama y AutoHealing en cada test.
 */
let ollamaClient: OllamaClient | null = null;
let healer: AutoHealing | null = null;

/**
 * Inicializa el healer una sola vez por ejecucion.
 * Como es async y puede llamarse desde multiples tests en paralelo,
 * usamos una flag para evitar inicializaciones duplicadas.
 */
let initializing = false;
let initialized = false;

async function ensureInitialized(): Promise<void> {
    if (initialized) return;

    if (initializing) {
        // Otro test ya esta inicializando, esperamos un poco
        while (!initialized) {
            await new Promise((r) => setTimeout(r, 100));
        }
        return;
    }

    initializing = true;
    try {
        ollamaClient = new OllamaClient();
        healer = new AutoHealing(ollamaClient);

        const available = await ollamaClient.isAvailableLLM();
        if (available) {
            await healer.initialize();
        }
        initialized = true;
    } finally {
        initializing = false;
    }
}

export async function attachHealingSuggestion(testInfo: TestInfo): Promise<void> {
    // Solo actuamos si el test fallo
    if (testInfo.status !== 'failed') return;

    // Si no hay error, no podemos analizar nada
    if (!testInfo.error?.message) return;

    try {
        // Inicializar Ollama y AutoHealing (solo la primera vez)
        await ensureInitialized();

        if (!healer || !ollamaClient) return;

        // Verificar que Ollama este disponible
        const available = await ollamaClient.isAvailableLLM();
        if (!available) {
            testInfo.attach('Auto-Healing ⚠️', {
                body: 'Ollama no esta disponible. Sugerencia no generada.',
                contentType: 'text/plain',
            });
            return;
        }

        // Construir el fallo con los datos del test
        const suggestion = await healer.analyzeFailure({
            testName: testInfo.title,
            errorMessage: testInfo.error.message,
            file: testInfo.file ?? '',
            line: testInfo.line,
        });

        // Adjuntar la sugerencia al reporte HTML
        // Aparece como un archivo de texto en la seccion de Attachments del test
        testInfo.attach('Auto-Healing Suggestion', {
            body: suggestion.analysis,
            contentType: 'text/plain',
        });

        console.log(`[Healing] Sugerencia adjuntada al test: ${testInfo.title}`);
    } catch (error) {
        // Si algo falla, adjuntamos el error en vez de la sugerencia
        testInfo.attach('Auto-Healing Error', {
            body: `No se pudo generar la sugerencia: ${error instanceof Error ? error.message : String(error)}`,
            contentType: 'text/plain',
        });
    }
}