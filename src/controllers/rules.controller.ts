import { Controller, Get, Route, Request, Tags, Post, Body, Delete, Path } from "@tsoa/runtime";
import { Request as ExRequest } from 'express';

import ElastalertServer from '../elastalert_server';
import { RuleNotFoundError } from "../common/errors/rule_request_errors";

interface RulesGetRulesResponse {
    rules: string[];
}

interface RulesAddRulePayload {
    yaml: string
}

interface RulesAddResponse {
    created: boolean;
    id: string;
}

@Route("/rules")
@Tags("rules")
export class RulesController extends Controller {
    @Get("")
    public async getRules(@Request() request: ExRequest): Promise<RulesGetRulesResponse> {
        let server: ElastalertServer = request.app.get('server');        
        let rulesService = server.rulesService;

        let path = <string>request.query.path || ''; // TODO: probably not used
        
        return await rulesService.getRules(path);;
    }

    @Get("{id}")
    public async getRule(@Request() request: ExRequest, @Path("id") id: string): Promise<string> {
        let server: ElastalertServer = request.app.get('server');        
        let rulesService = server.rulesService;
        
        let rule = await rulesService.rule(id);

        return await rule.get();
    }

    // TODO: split to POST and PUT
    @Post("{id}")
    public async addRule(@Request() request: ExRequest, @Path("id") id: string, @Body() body: RulesAddRulePayload): Promise<RulesAddResponse> {
        let server: ElastalertServer = request.app.get('server');
        let rulesService = server.rulesService;

        try {
            let rule = await rulesService.rule(id);

            await rule.edit(body.yaml);

            return {
                created: true,
                id: request.params.id
            };
        }

        catch (error) {
            if (error instanceof RuleNotFoundError) {
                rulesService.createRule(id, body.yaml);
                return {
                    created: true,
                    id: request.params.id
                };
            }

            throw error;
        }
    }

    @Delete("{id}")
    public async deleteRule(@Request() request: ExRequest, @Path("id") id: string): Promise<void> {
        let server: ElastalertServer = request.app.get('server');        
        let rulesService = server.rulesService;
        
        let rule = await rulesService.rule(id);

        await rule.delete();
    }    
}