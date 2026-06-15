// ===================================================================
// heal-report.ts
// Script que genera el reporte de auto-healing a partir de los
// resultados de la ultima ejecucion de tests.
//
// Uso:
//   yarn heal:report
//
// Requisitos previos:
//   1. Ollama corriendo con tu modelo (qwen2.5-coder:1.5b)
//   2. Tests ejecutados con Allure (yarn allure:e2e)
//      para que existan los JSON en allure-results/
//   3. LangChain instalado (ya esta en devDependencies)
//
// Que hace este script:
//   1. Verifica que Ollama este vivo
//   2. Lee allure-results/*.json y extrae los tests fallidos
//   3. Le pasa cada fallo al AutoHealing (LangChain + Ollama)
//   4. Genera auto-healing-report.md con las sugerencias
// ===================================================================

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OllamaClient } from '../tests/helpers/ollama.client';
import { AutoHealing, type TestFailure } from '../tests/helpers/auto-healing';

// -------------------------------------------------------------------
// Configuracion
// -------------------------------------------------------------------

/** Carpeta donde Allure guarda los resultados (un -result.json por test) */
const RESULTS_DIR = join(process.cwd(), 'allure-results');

/** Archivo de salida del reporte de auto-healing */
const OUTPUT_FILE = join(process.cwd(), 'auto-healing-report.md');

// -------------------------------------------------------------------
// Funcion: extraer fallos de allure-results/
// -------------------------------------------------------------------

/**
 * Lee todos los archivos -result.json de allure-results/ y devuelve
 * SOLO los tests que no pasaron (status = "failed" o "broken").
 *
 * Cada JSON de Allure tiene esta forma:
 * {
 *   "name": "CARD-04: validar las stats y sus valores",
 *   "status": "failed",
 *   "statusDetails": { "message": "expect(received).toBeGreaterThan..." },
 *   "fullName": "tests\\card.spec.ts"
 * }
 */
function extractFailures(): TestFailure[] {
    if (!existsSync(RESULTS_DIR)) {
        console.error(`ERROR: No existe la carpeta "${RESULTS_DIR}"`);
        console.error('Ejecuta primero: yarn allure:e2e');
        process.exit(1);
    }

    // Filtramos solo los archivos JSON de resultados de Allure
    const files = readdirSync(RESULTS_DIR).filter(
        (f) => f.endsWith('-result.json')
    );

    if (files.length === 0) {
        console.error(`No se encontraron resultados en ${RESULTS_DIR}`);
        process.exit(1);
    }

    const failures: TestFailure[] = [];

    for (const file of files) {
        const filePath = join(RESULTS_DIR, file);

        let json: any;
        try {
            const raw = readFileSync(filePath, 'utf-8');
            json = JSON.parse(raw);
        } catch {
            // Archivo corrupto o vacio, lo salteamos
            continue;
        }

        // Solo nos interesan tests que fallaron
        if (json.status === 'passed' || json.status === 'skipped') {
            continue;
        }

        const testName: string = json.name ?? 'Test sin nombre';
        const errorMessage: string =
            json.statusDetails?.message ?? 'Sin detalles del error';
        const fileName: string = json.fullName ?? '';

        // Intentamos extraer el numero de linea del stack trace
        // Formato tipico: "at D:\proyecto\tests\card.spec.ts:50:5"
        const lineMatch = errorMessage.match(/at\s+.+:(\d+):\d+/);
        const line = lineMatch ? parseInt(lineMatch[1], 10) : 0;

        failures.push({ testName, errorMessage, file: fileName, line });
    }

    return failures;
}

// -------------------------------------------------------------------
// Funcion principal
// -------------------------------------------------------------------

async function main(): Promise<void> {
    console.log('========================================');
    console.log('  Auto-Healing Report Generator');
    console.log('  Ollama + LangChain + Allure');
    console.log('========================================');
    console.log('');

    // ──── PASO 1: Verificar que Ollama esta vivo ────
    console.log('[1/3] Verificando Ollama...');
    const ollama = new OllamaClient();

    const available = await ollama.isAvailableLLM();
    if (!available) {
        console.error('ERROR: Ollama no responde.');
        console.error('Ejecuta: ollama serve');
        console.error(`Modelo esperado: ${ollama.getModel()}`);
        process.exit(1);
    }
    console.log(`  OK - Ollama responde (modelo: ${ollama.getModel()})`);
    console.log('');

    // ──── PASO 2: Extraer fallos de allure-results/ ────
    console.log('[2/3] Leyendo resultados de tests...');
    const failures = extractFailures();

    if (failures.length === 0) {
        console.log('  No hay tests fallidos. Nada que analizar.');
        const emptyReport = '# Auto-Healing Report\n\n> Todos los tests pasaron. No hay nada que curar.\n';
        writeFileSync(OUTPUT_FILE, emptyReport, 'utf-8');
        console.log(`  Reporte vacio guardado en: ${OUTPUT_FILE}`);
        return;
    }

    console.log(`  ${failures.length} test(s) fallido(s) encontrado(s):`);
    for (const f of failures) {
        console.log(`    - ${f.testName}`);
        console.log(`      ${f.file}:${f.line}`);
    }
    console.log('');

    // ──── PASO 3: Analizar con Ollama via LangChain ────
    console.log('[3/3] Analizando fallos con Ollama...');
    console.log('  (esto puede tardar unos segundos por cada fallo)');
    console.log('');

    const healer = new AutoHealing(ollama);

    // Inicializa LangChain ChatOllama
    await healer.initialize();

    // Agregamos todos los fallos a la cola de analisis
    for (const failure of failures) {
        healer.addFailure(failure);
    }

    // Analiza uno por uno y devuelve las sugerencias
    await healer.analyzeAllFailures();

    // Genera el reporte markdown
    const report = healer.generateReport();

    // Guarda en disco
    writeFileSync(OUTPUT_FILE, report, 'utf-8');
    console.log(`  Reporte guardado en: ${OUTPUT_FILE}`);
    console.log('');

    // ──── Mostrar preview en consola ────
    console.log('========================================');
    console.log('  REPORTE GENERADO');
    console.log('========================================');
    console.log('');
    console.log(`  Archivo: ${OUTPUT_FILE}`);
    console.log(`  Abri con: code ${OUTPUT_FILE}`);
    console.log('');
    console.log('  Resumen:');
    for (const f of failures) {
        console.log(`    - ${f.testName}`);
    }
    console.log('');
}

main().catch((error) => {
    console.error('ERROR FATAL:', error instanceof Error ? error.message : error);
    process.exit(1);
});
