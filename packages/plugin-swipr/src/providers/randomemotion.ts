import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";

const randomEmotionProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        const emotions = {
            happy:
                _runtime.character.name +
                " is feeling joyful and content, with a sense of lightness and optimism",
            sad:
                _runtime.character.name +
                " is experiencing melancholy and heaviness, with a tinge of wistfulness",
            excited:
                _runtime.character.name +
                " is bubbling with enthusiasm and eager anticipation",
            anxious:
                _runtime.character.name +
                " is feeling unsettled with racing thoughts and nervous energy",
            peaceful:
                _runtime.character.name +
                " is experiencing a calm and tranquil state of mind",
            frustrated:
                _runtime.character.name +
                " is feeling irritated and blocked from achieving desired goals",
            curious:
                _runtime.character.name +
                " is filled with wonder and an eagerness to explore and learn",
            grateful:
                _runtime.character.name +
                " is experiencing deep appreciation and contentment",
            energetic:
                _runtime.character.name +
                " is feeling dynamic and full of vibrant energy",
            contemplative:
                _runtime.character.name +
                " is in a thoughtful and reflective state of mind",
        };

        const emotionKeys = Object.keys(emotions);
        const randomKey =
            emotionKeys[Math.floor(Math.random() * emotionKeys.length)];

        return emotions[randomKey];
    },
};
export { randomEmotionProvider };
