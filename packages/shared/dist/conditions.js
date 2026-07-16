"use strict";
// Condition engine for questionnaire logic. Used by:
//  - web: `showIf` visibility of questions (live, client-side)
//  - api: Red-Flag rule evaluation on submission (server-side)
// Conditions are stored as JSON in the DB — new logic ships without code changes.
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateCondition = evaluateCondition;
function evaluateCondition(cond, answers) {
    if ("all" in cond)
        return cond.all.every((c) => evaluateCondition(c, answers));
    if ("any" in cond)
        return cond.any.some((c) => evaluateCondition(c, answers));
    if ("not" in cond)
        return !evaluateCondition(cond.not, answers);
    const actual = answers[cond.q];
    switch (cond.op) {
        case "answered":
            return actual !== undefined && actual !== null && actual !== "";
        case "eq":
            return actual === cond.value;
        case "ne":
            return actual !== cond.value;
        case "gt":
            return typeof actual === "number" && actual > Number(cond.value);
        case "gte":
            return typeof actual === "number" && actual >= Number(cond.value);
        case "lt":
            return typeof actual === "number" && actual < Number(cond.value);
        case "lte":
            return typeof actual === "number" && actual <= Number(cond.value);
        case "includes":
            return Array.isArray(actual) && actual.includes(cond.value);
        default:
            return false;
    }
}
