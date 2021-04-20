import { Body, Controller, Post, Route, Tags, Request } from "tsoa";
import { Request as ExRequest } from 'express';
import { TestRuleOptions } from "../models/test/test-rule-options.model";
import ElastalertServer from "../elastalert_server";

interface TestRulePayload {
    rule: string;
    options?: TestRuleOptions
}

@Route("/test")
@Tags("test")
export class TestController extends Controller {
    @Post("")
    public async testRule(@Body() body: TestRulePayload, @Request() request: ExRequest): Promise<any> {
        // TODO: default for options when not send        
        let server: ElastalertServer = request.app.get('server');

        try {
            return await server.testService.testRule(body.rule, body.options);
        }

        catch (error)
        {
            throw error;
        }
    }
}