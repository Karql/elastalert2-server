import { RequestHandler } from "express";

export type RouteMethod =  'get' | 'post' | 'delete';

export interface Route {
    // The path to route (without '/' at the start).
    path: string;
    // The method to route. Can be any of the [Express routing methods](http://expressjs.com/en/4x/api.html#routing-methods). 
    method: RouteMethod | RouteMethod[];
    // The handler function for this route. See the [Express documentation](http://expressjs.com/en/4x/api.html) for more info.
    // If 'method' is an array, this property should be an equal length array too.
    handler: RequestHandler | RequestHandler[];
}
