export class OllamaClient {
    private readonly baseUrl: string;
    private readonly model: string;
    private readonly temperature: number;

    constructor(model = 'qwen2.5-coder:1.5b', baseUrl = 'http://192.168.1.179:11434', temperature = 0.2) {
        this.model = model;
        this.baseUrl = baseUrl;
        this.temperature = temperature;
    }

    getBaseUrl(): string {
        return this.baseUrl;
    }

    getTemperature(): number {
        return this.temperature;
    }
    /**
     * Envía un prompt a Ollama y devuelve la respuesta generada.
     * Usa stream: false para recibir la respuesta completa de una vez.
     *
     * @param prompt - El texto del prompt a enviar al modelo
     * @returns El texto generado por el modelo
     */
    async generate(prompt: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(
                `Ollama respondio con error ${response.status}: ${response.statusText}`
            );
        }

        const data = (await response.json()) as { response: string };
        return data.response;
    }

    /**
     * Verifica si Ollama está corriendo y tiene el modelo disponible.
     * Llama a /api/tags y busca el modelo en la lista de modelos instalados.
     *
     * @returns true si Ollama está vivo y el modelo existe
     */
    async isAvailableLLM(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) return false;

            const data = (await response.json()) as {
                models?: Array<{ name: string }>;
            };

            const models = data.models ?? [];
            return models.some(
                (m) => m.name === this.model || m.name.startsWith(`${this.model}:`)
            );
        } catch {
            return false;
        }
    }

    /** Devuelve el nombre del modelo configurado */
    getModel(): string {
        return this.model;
    }
}