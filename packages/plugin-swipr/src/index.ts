import { Plugin } from "@elizaos/core";
import { getScoreAction } from "./actions/getScore.ts";
import { tokensScoreProvider } from "./providers";

export * as actions from "./actions";
export * as providers from "./providers";

export const swiprPlugin: Plugin = {
    name: "swipr",
    description: "Swipr plugin for ElizaOS",
    actions: [getScoreAction],
    evaluators: [],
    providers: [tokensScoreProvider],
};
