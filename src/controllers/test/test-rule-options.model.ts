// TODO: joi schema

export interface TestRuleOptions {
    testType: "all" | "schemaOnly" | "countOnly";
    days: number;
    alert: boolean;
    format: "json";
    maxResults: number;
}