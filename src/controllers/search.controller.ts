import { Body, Controller, Path, Post, Route, Tags } from "@tsoa/runtime";
import { getClient } from "../common/elasticsearch_client";

@Route("/search")
@Tags("search")
export class SearchController extends Controller {
    @Post("{index}")
    public async postSearch(@Path("index") index: string, @Body() body?: any): Promise<any> {
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