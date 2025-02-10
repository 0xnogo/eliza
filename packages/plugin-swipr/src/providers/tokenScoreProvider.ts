import {
    type IAgentRuntime,
    type Memory,
    type Provider,
    type State,
    elizaLogger,
} from "@elizaos/core";
import type { TokenData } from "../types/token";

async function fetchTokenByAddress(address: string): Promise<TokenData | null> {
    const apiEndpoint =
        process.env.SWIPR_API_ENDPOINT || "http://localhost:3000";

    try {
        const response = await fetch(`${apiEndpoint}/tokens/${address}`, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`API request failed: ${response.statusText}`);
        }

        return (await response.json()) as TokenData;
    } catch (error) {
        elizaLogger.error(`Error fetching token ${address}:`, error);
        throw error;
    }
}

function formatTokenResponse(token: TokenData): string {
    return `
Token: ${token.info.name} (${token.info.symbol})
Score: ${token.score.value} (${token.score.title})
Price Change 24h: ${token.info.h24Change}%
Market Cap: $${token.info.marketCap.toLocaleString()}
Links: ${Object.entries(token.links)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")}
`.trim();
}

export const tokenScoreProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state?: State,
    ): Promise<string> => {
        try {
            const content =
                typeof message.content === "string"
                    ? message.content
                    : message.content?.text;

            if (!content) {
                throw new Error("No message content provided");
            }

            // Extract address from content
            const address = content.trim();
            const token = await fetchTokenByAddress(address);

            if (!token) {
                return `No token found for address: ${address}`;
            }

            return formatTokenResponse(token);
        } catch (error) {
            elizaLogger.error("Address provider error:", error);
            return `Error: ${error.message}`;
        }
    },
};

// Helper function to get specific token data
export async function getTokenByAddressData(
    runtime: IAgentRuntime,
    address: string,
): Promise<TokenData | null> {
    return fetchTokenByAddress(address);
}
