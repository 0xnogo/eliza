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

function composeResponseContext(scoreData: unknown, state: State): string {
    const scoreResponseTemplate = `
    You are a crypto analyst providing concise token score updates. The scores are rated out of 6.

    Here is the score data for the token:
    ${JSON.stringify(scoreData, null, 2)}

    Previous messages for context:
    {{recentMessages}}

    Generate a concise, data-focused response in the style of crypto Twitter. Include:
    1. Token symbol with $ prefix
    2. Key metrics with actual numbers
    3. Brief technical context or trend
    4. Optional second line for additional context if significant

    Example response for good scores:
    "$TOKEN metrics solid: 5.2/6 overall score. 24h vol $16.5M, 122k holders\n\ndev-locked supply + 92% holder retention while others bleeding. fundamentals intact"

    Example response for poor scores:
    "$TOKEN metrics concerning: 2.1/6 score. vol down 65%, holders -12k\n\nweak distribution pattern + low social engagement. exercise caution"

    Based on the score data above, generate an appropriate response:`;

    const context = composeContext({
        state,
        template: scoreResponseTemplate,
    });

    return context;
}
export const getScoreAction: Action = {
    name: "GET_SCORE",
    similes: ["SCORE", "RATING", "TOKEN_SCORE", "TOKEN_RANK"],
    description:
        "Use this action to get the score of a token. The score is a number between 0 and 100.",
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
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
        console.log(tokenAddress);

        const baseUrl = "https://swipr-api-prod-8d24016ec292.herokuapp.com";

        const response = await axios.get<ScoreResponse>(
            `${baseUrl}/tokens/${tokenAddress}/history`,
            {
                headers: {
                    accept: "application/json",
                },
            },
        );
        console.log(response.data);

        if (!response.data) {
            throw new Error("No data received from Swipr API");
        }

        const scoreData = response.data.scores.map((score) => {
            const date = new Date(score.updatedAt).toLocaleDateString();
            return {
                date,
                overall: score.value,
                title: score.title,
                grades: score.grades,
            };
        });

        const context = composeResponseContext(scoreData, _state);

        const resultReponse = await generateText({
            runtime: _runtime,
            context,
            modelClass: ModelClass.LARGE,
        });

        elizaLogger.success("Score data analyzed successfully!");

        if (_callback) {
            _callback({
                text: resultReponse,
                content: result,
            });
        }
        return response;
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
