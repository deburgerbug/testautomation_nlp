import { createOllama } from 'ai-sdk-ollama';
import { Stagehand, AISdkClient, type V3Options } from "@browserbasehq/stagehand";

const ollama = createOllama({
   baseURL: process.env.NGROK_URL || 'http://localhost:11434', // Use /v1 for OpenAI compatibility
  headers: {
    "ngrok-skip-browser-warning": "true" // Required to bypass ngrok's HTML warning page
  }
});

class AISdkClientWithLanguageModel extends AISdkClient {
    private modelInstance: any;
    constructor(config: { model: any }) {
        super(config);
        this.modelInstance = config.model;
    }
    getLanguageModel() { return this.modelInstance; }
}

export function createNgllamaStagehand({
    modelName = " ",
    ...overrides
}: Partial<V3Options> & { modelName?: string } = {}) {
    return new Stagehand({
        env: "LOCAL",
        verbose: 2, // Default in the factory
        ...overrides,
        llmClient: new AISdkClientWithLanguageModel({
            model: ollama(modelName),
        }),
    });
}
