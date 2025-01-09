import { Plugin } from "@elizaos/core";
import { helloWorldAction } from "./actions/helloworld.ts";

import { currentNewsAction } from "./actions/currentnews.ts";
import { randomEmotionProvider } from "./providers/randomemotion.ts";
export * as actions from "./actions/index.ts";
export * as evaluators from "./evaluators/index.ts";
export * as providers from "./providers/index.ts";

export const swiprPlugin: Plugin = {
    name: "swipr",
    description: "Swipr plugin for ElizaOS",
    actions: [helloWorldAction, currentNewsAction],
    evaluators: [],
    providers: [randomEmotionProvider],
};
