import {
    ActionExample,
    Content,
    generateText,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    type Action,
} from "@elizaos/core";

export const currentNewsAction: Action = {
    name: "CURRENT_NEWS",
    similes: ["NEWS"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    description:
        "Get the current news for a search term if provided by the user",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: { [key: string]: unknown },
        _callback: HandlerCallback
    ): Promise<boolean> => {
        const template = `
        extract the search term from the user's message. The message is:
        ${_message.content.text}
        Only return the search term, no other text.
        `;
        const searchTerm = await generateText({
            runtime: _runtime,
            context: template,
            modelClass: ModelClass.SMALL,
            stop: ["\n"],
        });
        const news = await fetch(
            `https://newsapi.org/v2/everything?q=${searchTerm}&apiKey=369643662a994664b24dd1867cb1b8e9`
        );
        const newsData = await news.json();
        const articles = newsData.articles;
        const returnArticles = articles
            .slice(0, 5)
            .map(
                (article) =>
                    `${article.title}\n${article.description}\n${article.content.slice(0, 1000)}`
            )
            .join("\n\n");

        const newMemory: Memory = {
            userId: _message.agentId,
            agentId: _message.agentId,
            roomId: _message.roomId,
            content: {
                text: returnArticles,
                action: "CURRENT_NEWS_RESPONSE",
                source: _message.content.source,
            } as Content,
        };

        // await _runtime.messageManager.createMemory(newMemory);
        _callback(newMemory.content);
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What's happening in the news?" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "CURRENT_NEWS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Can you show me the latest news articles?" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "CURRENT_NEWS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "What's the latest news about bitcoin?" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "CURRENT_NEWS",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
