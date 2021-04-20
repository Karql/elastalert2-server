import { Controller, Get, Route, Tags } from "tsoa";
import { getClient } from "../common/elasticsearch_client";

@Route("/mapping")
@Tags("mapping")
export class MappingController extends Controller {
    @Get("{index}")
    public async getMapping(@Route("index") index: string): Promise<any> {
        let client = getClient();

        return await client.indices.getMapping({index: index});        
    }
}