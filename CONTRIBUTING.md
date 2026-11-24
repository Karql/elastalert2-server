# Contributing to ElastAlert2 Server

Thanks for your interest in the project! Bug reports, ideas and pull requests are welcome.

## Reporting issues

Report bugs and suggestions on the [issues page](https://github.com/karql/elastalert2-server/issues). Please include:

- the version of the server (`GET /` or the Docker image tag) and of ElastAlert2
- steps to reproduce the problem
- the error response and the relevant logs (run with `LOG_LEVEL=debug` for more details)

For a bigger change, please open an issue first, so we can agree on the approach before you spend time on the code.

## Development setup

Requirements:

- Node.js in the version from [`.nvmrc`](.nvmrc) (`nvm install` / `nvm use`)
- [ElastAlert2](https://github.com/jertel/elastalert2) (`pip install elastalert2`) available as `python -m elastalert...`, the server starts it and stops when it exits. Without it, the easiest way to run everything is the Docker image (see [README](README.md#installation)).

```bash
git clone https://github.com/karql/elastalert2-server.git && cd elastalert2-server
npm ci
```

Create `config/config.dev.json` (ignored by git, used instead of `config/config.json`) pointing to your ElastAlert2 folder, which contains `config.yaml`, `config-test.yaml` and the `rules` folder, for example:

```json
{
  "elastalertPath": "/home/me/elastalert",
  "logging": { "level": "debug", "format": "pretty" }
}
```

Useful commands:

| Command | Description |
|---|---|
| `npm run dev` | runs `src/index.ts` with [tsx](https://tsx.is) and restarts on changes |
| `npm run typecheck` | type checks the code |
| `npm run build` | compiles to `dist/` |
| `npm start` | runs the compiled server |

The repository contains VS Code launch configurations for debugging (`.vscode/launch.json`).

### Code style

- TypeScript in strict mode, no `any`, the compiler also reports unused code, missing returns and switch fallthrough
- [EditorConfig](https://editorconfig.org) (`.editorconfig`): 2 spaces, LF, UTF-8
- `async` / `await` instead of callbacks and `.then()` chains

## Project structure
The code is organized by feature. Everything that belongs to one API area (routes, Zod schemas, service, errors) is in its own folder under `src/modules/`. Infrastructure shared by all modules is in `src/shared/`.

```
src/
  index.ts              entry point: loads config, starts the server
  server.ts             ElastalertServer: HTTP server, test websocket, ElastAlert process lifecycle
  app.ts                Hono app: middleware, module routes, OpenAPI spec, Swagger UI, error handling
  modules/
    info/               GET /
    status/             /status, ElastAlert process (process.service.ts)
    rules/              /rules
    templates/          /templates
    test/               POST /test and the /test websocket (test.ws.ts)
  shared/
    config/             config.json schema (Zod) and ConfigService
    errors/             RequestError (Problem Details, RFC 9457), ValidationError
    http/               OpenAPI helpers, request logging middleware and the Hono env type
    logger/             pino setup (logging.ts) and the Logger wrapper used by services
    file-system/        YamlFileStore (rule and template files, path checks) and file helpers
```

File names use kebab-case with a role suffix: `*.routes.ts`, `*.schemas.ts`, `*.service.ts`, `*.errors.ts`.

## Adding a new API

The HTTP layer uses [Hono](https://hono.dev) with [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi). A Zod schema describes each request and response. The same schema validates the request at runtime and generates the OpenAPI spec served at `/swagger.json`.

1. Create a module folder, e.g. `src/modules/example/`, with the schemas in `example.schemas.ts`:

    ```typescript
    import { z } from '@hono/zod-openapi';
    import { pathParam } from '../../shared/http/openapi';

    export const ExampleParams = z.object({ id: pathParam('id') });
    export const ExampleResponse = z.object({ id: z.string() }).openapi('ExampleResponse');
    ```

2. Add the routes in `example.routes.ts`:

    ```typescript
    import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
    import type { AppEnv } from '../../shared/http/app-env';
    import { errorResponses, json, notFoundResponse } from '../../shared/http/openapi';
    import { ExampleParams, ExampleResponse } from './example.schemas';

    const getExample = createRoute({
      method: 'get',
      path: '/{id}',
      tags: ['example'],
      operationId: 'GetExample',
      request: { params: ExampleParams },
      responses: {
        200: json(ExampleResponse, 'Example'),
        ...notFoundResponse,
        ...errorResponses,
      },
    });

    export const exampleRoutes = new OpenAPIHono<AppEnv>()
      .openapi(getExample, async (c) => {
        const { id } = c.req.valid('param'); // validated and typed

        return c.json({ id }, 200);
      });
    ```

3. Mount it in `src/app.ts`: `app.route('/example', exampleRoutes);`

Keep handlers thin and put the logic in `example.service.ts`. Services are created in `server.ts` and available in handlers through `c.get('server')`. To return an error, throw a `RequestError` subclass from `example.errors.ts`, it is sent as Problem Details (`application/problem+json`). Validation errors (422) are handled globally.

## Pull requests

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `!` / `BREAKING CHANGE:` for breaking changes). Reference issues in the message, e.g. `Closes #42`.
- `npm run typecheck` and `npm run build` pass.
- New behaviour and breaking changes are described in [CHANGELOG.md](CHANGELOG.md).
- New config options are added to the [config schema](src/shared/config/config.schema.ts), [`config/config.json`](config/config.json) when useful, and the configuration section of the [README](README.md#configuration).
- New or changed endpoints have correct Zod schemas and descriptions, so the Swagger documentation stays accurate.
