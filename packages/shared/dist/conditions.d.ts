export type Leaf = {
    /** question key the condition reads */
    q: string;
    op: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "includes" | "answered";
    value?: unknown;
};
export type Condition = Leaf | {
    all: Condition[];
} | {
    any: Condition[];
} | {
    not: Condition;
};
export type AnswerMap = Record<string, unknown>;
export declare function evaluateCondition(cond: Condition, answers: AnswerMap): boolean;
