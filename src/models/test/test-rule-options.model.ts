import { json } from "body-parser";

export interface TestRuleOptions {
    /**
     * Can be either "all", "schemaOnly" or "countOnly".
     * "all" will give the full console output.
     * "schemaOnly" will only validate the yaml config.
     * "countOnly" will only find the number of matching documents and list available fields.
     * @default "all"
     */
    testType: "all" | "schemaOnly" | "countOnly";
    /**
      * Can be any number larger than 0 and this tells ElastAlert over a period of how many days the test should be run
      * @isInt
      * @default 1
      * @minimum 1
      */
    days: number;
    /**
      * Whether to send real alerts
      * @default false
      */
    alert?: boolean;
    /**
      * When 'json' return results in structured JSON
      */
    format?: 'json';
    /**
      * Limit returned results to this amount (0 means no limit)
      * @default 0
      */
    maxResults: number;
}

export const TestRuleOptionsDefaults : TestRuleOptions = {
    testType: "all",
    days: 1,
    alert: false,
    // format: null
    maxResults: 0
}

// TODO: JOI schema?
// const optionsSchema = Joi.object().keys({
//   testType: Joi.string().valid('all', 'schemaOnly', 'countOnly').default('all'),
//   days: Joi.number().min(1).default(1),
//   alert: Joi.boolean().default(false),
//   format: Joi.string().default(''),
//   maxResults: Joi.number().default(0)
// }).default();
