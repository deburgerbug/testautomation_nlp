import "dotenv/config";
import { Stagehand, AISdkClient, type V3Options } from "@browserbasehq/stagehand";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || '',
});

class AISdkClientWithLanguageModel extends AISdkClient {
    private modelInstance: any;
    constructor(config: { model: any }) {
        super(config);
        this.modelInstance = config.model;
    }
    getLanguageModel() { return this.modelInstance; }
}

/**
 * Creates a Stagehand instance with sensible defaults.
 * @param modelName - The OpenRouter model ID
 * @param overrides - Any additional StagehandOptions (verbose, env, domSettledTimeout, etc.)
 */
export function createOpenrouterStagehand({
    modelName = "openrouter/free",
    ...overrides
}: Partial<V3Options> & { modelName?: string } = {}) {
    return new Stagehand({
        env: "LOCAL",
        verbose: 2, // Default in the factory
        ...overrides,
        llmClient: new AISdkClientWithLanguageModel({
            model: openrouter(modelName),
        }),
    });
}
