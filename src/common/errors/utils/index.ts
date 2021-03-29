import { Response } from "express";
import RequestError from "../request_error";

export function sendRequestError(response: Response, error: RequestError) {
  response.status(error.statusCode || 500).send(error);
}
