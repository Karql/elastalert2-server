import { Body, Controller, Post, Route, Tags } from "tsoa";
import { getClient } from "../common/elasticsearch_client";

@Route("/search")
@Tags("search")
export class SearchController extends Controller {
    @Post("{index}")
    public async postSearch(@Route("index") index: string, @Body() body?: any): Promise<any> {
        let client = getClient();

        try {
            return await client.search({
                index: index,
                body: body
            });
        }

        catch (error)
        {
            return error; // Error also return as 200
        }
    }
}