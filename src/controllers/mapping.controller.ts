import { Controller, Get, Path, Route, Tags } from "@tsoa/runtime";
import { getClient } from "../common/elasticsearch_client";

@Route("/mapping")
@Tags("mapping")
export class MappingController extends Controller {
    @Get("{index}")
    public async getMapping(@Path("index") index: string): Promise<any> {
        let client = getClient();

        return await client.indices.getMapping({index: index});        
    }
}