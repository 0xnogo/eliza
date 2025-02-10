import type { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";
import type { TokenData } from "../types/token";

export class TokensScoreProvider implements Provider {
    name = "score";

    async get(
        runtime: IAgentRuntime,
        message: Memory,
        _state?: State,
    ): Promise<string> {
        try {
            const tokens = await this.fetchTokens();
            return this.formatTokenScores(tokens);
        } catch (error) {
            elizaLogger.error("TokensScoreProvider error:", error);
            return `Error: ${error.message}`;
        }
    }

    private async fetchTokens(): Promise<TokenData[]> {
        const apiEndpoint =
            process.env.SWIPR_API_ENDPOINT || "http://localhost:3000";

        try {
            const response = await fetch(`${apiEndpoint}/tokens`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            return (await response.json()) as TokenData[];
        } catch (error) {
            elizaLogger.error("Error fetching token list:", error);
            throw error;
        }
    }

    private formatTokenScores(tokens: TokenData[]): string {
        // Sort tokens by score and get top 5
        const topTokens = tokens
            .sort((a, b) => b.score.value - a.score.value)
            .slice(0, 5);

        return topTokens
            .map(
                (token) =>
                    `${token.info.name} (${token.info.symbol}):\n` +
                    `  Score: ${token.score.value} (${token.score.title})\n` +
                    `  Market Cap: $${token.info.marketCap.toLocaleString()}\n` +
                    `  24h Change: ${token.info.h24Change}%`,
            )
            .join("\n\n");
    }

    // Helper method for direct data access
    async getTokensData(): Promise<TokenData[]> {
        return this.fetchTokens();
    }

    // Helper method to get formatted top tokens
    async getTopTokens(limit = 5): Promise<TokenData[]> {
        const tokens = await this.fetchTokens();
        return tokens
            .sort((a, b) => b.score.value - a.score.value)
            .slice(0, limit);
    }
}

export const tokensScoreProvider = new TokensScoreProvider();
