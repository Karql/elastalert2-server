import { Controller, Get, Route, Request, Tags, Post, Body, Delete, Path } from "@tsoa/runtime";
import { Request as ExRequest } from 'express';

import ElastalertServer from '../elastalert_server';
import { TemplateNotFoundError } from "../common/errors/template_request_errors";

interface TemplatesGetTemplatesResponse {
    templates: string[];
}

interface TemplatesAddTemplatePayload {
    yaml: string
}

interface TempatesAddResponse {
    created: boolean;
    id: string;
}

@Route("/templates")
@Tags("templates")
export class TemplatesController extends Controller {
    @Get("")
    public async getTemplates(@Request() request: ExRequest): Promise<TemplatesGetTemplatesResponse> {
        let server: ElastalertServer = request.app.get('server');        
        let templatesService = server.templatesService;

        let path = <string>request.query.path || ''; // TODO: probably not used
        
        return await templatesService.getTemplates(path);;
    }

    @Get("{id}")
    public async getTemplate(@Request() request: ExRequest, @Path("id") id: string): Promise<string> {
        let server: ElastalertServer = request.app.get('server');        
        let templatesService = server.templatesService;
        
        let template = await templatesService.template(id);

        return await template.get();
    }

    // TODO: split to POST and PUT
    @Post("{id}")
    public async addTemplate(@Request() request: ExRequest, @Path("id") id: string, @Body() body: TemplatesAddTemplatePayload): Promise<TempatesAddResponse> {
        let server: ElastalertServer = request.app.get('server');
        let templatesService = server.templatesService;

        try {
            let template = await templatesService.template(id);

            await template.edit(body.yaml);

            return {
                created: true,
                id: request.params.id
            };
        }

        catch (error) {
            if (error instanceof TemplateNotFoundError) {
                templatesService.createTemplate(id, body.yaml);
                return {
                    created: true,
                    id: request.params.id
                };
            }

            throw error;
        }
    }

    @Delete("{id}")
    public async deleteTemplate(@Request() request: ExRequest, @Path("id") id: string): Promise<void> {
        let server: ElastalertServer = request.app.get('server');        
        let templatesService = server.templatesService;
        
        let template = await templatesService.template(id);

        await template.delete();
    }    
}