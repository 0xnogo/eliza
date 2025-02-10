export interface TokenGrade {
    volume: number;
    littleHolders: number;
    mediumHolders: number;
    social: number;
    supplyAudit: number;
}

export interface TokenScore {
    value: number;
    title: string;
    indicator: "LOW" | "AVERAGE" | "HIGH";
    grades: TokenGrade;
}

export interface TokenLinks {
    discord: string | null;
    twitter: string | null;
    telegram: string | null;
    website: string | null;
    github: string | null;
}

export interface TokenOHLCV {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    unixTime: number;
    address: string;
    type: string;
}

export interface TokenInfo {
    name: string;
    symbol: string;
    address: string;
    imageUrl: string;
    creationDate: string;
    h24Change: string;
    h6Change: string;
    decimals: number;
    chainId: number;
    marketCap: number;
    rooterContract: string;
    ohlcv: TokenOHLCV[];
}

export interface TokenMeta {
    updatedAt: string;
    version: number;
    status: string;
}

export interface TokenData {
    id: string;
    info: TokenInfo;
    links: TokenLinks;
    score: TokenScore;
    meta: TokenMeta;
    expiryDate: string | null;
}
