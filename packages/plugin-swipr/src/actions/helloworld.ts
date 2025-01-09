import {
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";

export const helloWorldAction: Action = {
    name: "HELLO_WORLD",
    similes: ["HELLO"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    description: "Make a cool hello world ascii art",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        options: { [key: string]: unknown },
        callback: HandlerCallback
    ): Promise<boolean> => {
        const asciiArt = `
         _    _      _ _        __          __        _     _
        | |  | |    | | |       \\ \\        / /       | |   | |
        | |__| | ___| | | ___    \\ \\  /\\  / /__  _ __| | __| |
        |  __  |/ _ \\ | |/ _ \\    \\ \\/  \\/ / _ \\| '__| |/ _\` |
        | |  | |  __/ | | (_) |    \\  /\\  / (_) | |  | | (_| |
        |_|  |_|\\___|_|_|\\___/      \\/  \\/ \\___/|_|  |_|\\__,_|
        `;
        callback({ text: asciiArt });
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Show me a hello world" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "HELLO_WORLD",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Can you do a hello world ascii art?" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "HELLO_WORLD",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Hello!" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "HELLO_WORLD",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
