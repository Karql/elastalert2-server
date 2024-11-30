import { Body, Controller, Get, Path, Query, Route, Tags } from "@tsoa/runtime";
import { getClient } from "../common/elasticsearch_client";
import config from '../common/config';

function escapeLuceneSyntax(str: string) {
    return [].map
        .call(str, char => {
            if (
                char === '/' ||
                char === '+' ||
                char === '-' ||
                char === '&' ||
                char === '|' ||
                char === '!' ||
                char === '(' ||
                char === ')' ||
                char === '{' ||
                char === '}' ||
                char === '[' ||
                char === ']' ||
                char === '^' ||
                char === '"' ||
                char === '~' ||
                char === '*' ||
                char === '?' ||
                char === ':' ||
                char === '\\'
            ) {
                return `\\${char}`;
            }
            return char;
        })
        .join('');
}

function getQueryString(type: "elastalert_status" | "elastalert" | "elastalert_error" | "silence", rule_name?: string) {
    if (type === 'elastalert_error') {
        return '*:*';
    }
    else {
        return `rule_name:"${rule_name ? escapeLuceneSyntax(rule_name) : '*'}"`;
    }
}

@Route("/metadata")
@Tags("metadata")
export class MetadataController extends Controller {
    @Get("{type}")
    public async getMetadata(@Path("type") type: "elastalert_status" | "elastalert" | "elastalert_error" | "silence", 
        @Query("from") from?: number,
        @Query("size") size?: number,
        @Query("rule_name") rule_name?: string): Promise<any> {
        let client = getClient();

        try {
            let resp = await client.search({
                index: config.get().writeback_index,
                type: type,
                body: {
                  from : from || 0, 
                  size : size || 100,
                  query: {
                    query_string: {
                      query: getQueryString(type, rule_name)
                    }
                  },
                  sort: [{ '@timestamp': { order: 'desc' } }]
                }
            });

            let mapped = <any>resp;
            mapped.hits.hits = resp.hits.hits.map(h => h._source);
            return mapped.hits;
        }

        catch (error)
        {
            return { error: error }; // Error also return as 200
        }
    }
}