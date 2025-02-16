import {
    type Action,
    type ActionExample,
    composeContext,
    elizaLogger,
    generateObject,
    generateText,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
} from "@elizaos/core";
import axios from "axios";
import { z } from "zod";

const getScoreTemplate = `
Extract the following parameters for cryptocurrency price data:
- **token_address** (string): The address of the token to get the score of (e.g., "Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump")

Provide the values in the following JSON format:
\`\`\`json
{
    "token_address": "Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump"
}
\`\`\`

Example request: "What's the current score of Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump?"
Example response:
\`\`\`json
{
    "token_address": "Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump"
}
\`\`\`

Example request: "What's the current score of PEANUT bGxHNbsacaVL35pkYWae5PYQDZXSpuQb3QDyW31pump?"
Example response:
\`\`\`json
{
    "token_address": "bGxHNbsacaVL35pkYWae5PYQDZXSpuQb3QDyW31pump"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}

Based on the conversation above, if the request is for cryptocurrency score data, extract the appropriate parameters and respond with a JSON object. If the request is not related to score data, respond with null.
`;

interface ScoreResponse {
    id: string;
    scores: {
        value: number;
        title: string;
        grades: {
            volume: number;
            littleHolders: number;
            mediumHolders: number;
            social: number;
            supplyAudit: number;
        };
        updatedAt: string;
    }[];
}

const GetScoreSchema = z.object({
    token_address: z.string(),
});

const scoreResponseTemplate = `
You are a crypto analyst providing concise token score updates. The scores are rated out of 6.

Here is the score data for the token
Ticker:
{{token_ticker}}
Address:
({{token_address}}):
Score:
{{score}}

Previous messages for context:
{{recentMessages}}

Generate a concise, data-focused response in the style of crypto Twitter. Include:
1. Write 1-2 short sentences about the token(s) performance
2. Feel free to mention the scores in your response and the grades to justify your statements
3. If comparing two tokens, highlight interesting contrasts
4. Keep the tone professional but engaging
5. Don't use hashtags expect for token tickers
6. Don't ask questions
7. Use the token ticker with a $ or # symbol depending on how the ticker was defined in the token scores section
8. Expect the token ticker with can be in CAPITAL LETTERS, the rest should be in lowercase

Example response for good scores:
$/#TOKEN metrics solid: 5.2/6 overall score. 24h vol $16.5M, 122k holders\n\ndev-locked supply + 92% holder retention while others bleeding. fundamentals intact

Example response for poor scores:
$/#TOKEN metrics concerning: 2.1/6 score. vol down 65%, holders -12k\n\nweak distribution pattern + low social engagement. exercise caution

Write a concise tweet from a market analyst perspective about the token. Use the ticker in your reponse and not the token address. Focus on performance, trust, or market position.
Your response should not contain any questions. Brief, concise statements only. The total character count MUST be less than {{maxTweetLength}}. No emojis. Use \\n\\n (double spaces) between statements if there are multiple statements in your response.`;

export const getScoreAction: Action = {
    name: "GET_SCORE",
    similes: ["SCORE", "RATING", "TOKEN_SCORE", "TOKEN_RANK"],
    description:
        "Use this action to get the score of a token. The score reflects the evaluation of the token's performance, trust, and market position.",
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    suppressInitialMessage: true,
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: any,
        _callback: HandlerCallback,
    ) => {
        elizaLogger.log("Starting Swipr GET_SCORE handler...");

        if (!_state) {
            _state = (await _runtime.composeState(_message)) as State;
        }
        _state = await _runtime.updateRecentMessageState(_state);

        elizaLogger.log("Composing score context...");

        const scoreContext = composeContext({
            state: _state,
            template: getScoreTemplate,
        });
        elizaLogger.log("Generating content from template...");
        const result = await generateObject({
            runtime: _runtime,
            mode: "auto",
            context: scoreContext,
            modelClass: ModelClass.LARGE,
            schema: GetScoreSchema,
        });
        const content = result.object as z.infer<typeof GetScoreSchema>;
        const tokenAddress = content.token_address;
        console.log("Score to fetch: ", tokenAddress);

        const baseUrl = "https://swipr-api-prod-8d24016ec292.herokuapp.com";

        const responseHistory = await axios.get(
            `${baseUrl}/tokens/${tokenAddress}/history`,
            {
                headers: {
                    accept: "application/json",
                },
            },
        );

        const responseCurrent = await axios.get(
            `${baseUrl}/tokens/${tokenAddress}`,
            {
                headers: {
                    accept: "application/json",
                },
            },
        );

        if (!responseHistory.data) {
            throw new Error("No data received from Swipr API");
        }

        const historyData = responseHistory.data.scores
            .map(
                (score) =>
                    `History Score from ${new Date(score.updatedAt).toLocaleDateString()}:\n` +
                    `Score: ${score.value}/100 (${score.title})\n` +
                    `Grades (/6):\n` +
                    `Volume: ${score.grades.volume}/6\n` +
                    `Little Holders: ${score.grades.littleHolders}/6\n` +
                    `Medium Holders: ${score.grades.mediumHolders}/6\n` +
                    `Social: ${score.grades.social}/6\n` +
                    `Supply Audit: ${score.grades.supplyAudit}/6`,
            )
            .join("\n\n");

        const currentData =
            `Current data:\n` +
            `Market Cap: $${responseCurrent.data.token.info.marketCap.toLocaleString()}\n` +
            `24h Change: ${responseCurrent.data.token.info.h24Change}%\n`;

        let scoreData = currentData + "\n\n" + historyData;

        const state = await _runtime.composeState(_message, {
            score: scoreData,
            token_ticker:
                (responseCurrent.data.token.info.symbol.length > 6
                    ? "#"
                    : "$") + responseCurrent.data.token.info.symbol,
            token_address: tokenAddress,
        });

        const context = composeContext({
            state: state,
            template: scoreResponseTemplate,
        });

        const resultReponse = await generateText({
            runtime: _runtime,
            context,
            modelClass: ModelClass.LARGE,
        });

        elizaLogger.success("Score data analyzed successfully!");

        if (_callback) {
            _callback({
                text: resultReponse,
                content: {
                    success: true,
                },
            });
        }
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the score for the token at address 0x1234...5678?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check the score for that token address.",
                    action: "GET_SCORE",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "The token is showing strong performance with an overall score of {{dynamic}}/6. The volume metrics are healthy at {{dynamic}}/6, indicating good trading activity. The holder distribution looks balanced with small holders at {{dynamic}}/6 and medium holders at {{dynamic}}/6. Social engagement is active at {{dynamic}}/6, and the supply audit score of {{dynamic}}/6 suggests solid tokenomics fundamentals. Over the past few days, the token has maintained consistent performance with a slight upward trend in trading volume.",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you get me the score details for 0xabcd...ef90?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll retrieve the detailed scores for that token.",
                    action: "GET_SCORE",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "The analysis shows some concerning metrics for this token. The overall score is {{dynamic}}/6, which is below average. Trading volume is particularly weak at {{dynamic}}/6, and the holder distribution raises some red flags with small holders at {{dynamic}}/6 and medium holders at {{dynamic}}/6. Social engagement is limited at {{dynamic}}/6, while the supply audit score of {{dynamic}}/6 indicates potential issues with tokenomics. The trend over the past few days shows declining volume metrics, suggesting caution is warranted.",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
