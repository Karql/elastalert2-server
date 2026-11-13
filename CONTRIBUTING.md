# OUTDATED!!!

# Contributing to ElastAlert Server
**Do you want to contribute to our ElastAlert Server or issue an issue? Great! Since we hate rejecting pull requests or ask you to describe your issue more clearly, please read these guidelines carefully:**

## Filing an issue
- Describe your issue clearly. 
- When issuing a bug, please provide steps on how to recreate the bug if possible. 
- If you get an error, include the error in your issue

We seriously appreciate thoughtful comments. If an issue is important to you, add a comment with a solid write up of your use case and explain why it's so important. Please avoid posting comments comprised solely of a thumbs up emoji :+1:.

Granted that you share your thoughts, we might even be able to come up with creative solutions to your specific problem. If everything you'd like to say has already been brought up but you'd still like to add a token of support, feel free to add a :+1: [thumbs up reaction](https://github.com/blog/2119-add-reactions-to-pull-requests-issues-and-comments) on the issue itself and on the comment which best summarizes your thoughts.

## Contributing code
First and foremost, before you start working on any code, please **check the issues and file an issue first**. Someone could already be working on your problem or we need to tell you about some known issues before working on the pull request.

We enjoy working with contributors to get their code accepted. There are many approaches to fixing a problem and it is important to find the best approach before writing too much code.

### Setting up the development environment
First, fork this repository and clone it:

```bash
git clone https://github.com/[YOUR_USERNAME]/elastalert.git elastalert
cd elastalert
```

Then follow the default installation steps, so:

1. Run `nvm install "$(cat .nvmrc)"` to install & use the required NodeJS version.
2. Run `npm install` to install all the dependencies.
3. Look at the `Config` section in [REAMDE.md](../README.md#config) to setup the path to your ElastAlert instance.

### Linting
We use [ESLint](http://eslint.org/) to ensure the that the [Styleguide](../STYLEGUIDE.md) is being followed so we suggest you integrate it in your code editor to get live feedback.

Here are some hints for getting eslint setup in your favorite editor:

Editor     | Plugin
-----------|-------------------------------------------------------------------------------
Sublime    | [SublimeLinter-eslint](https://github.com/roadhump/SublimeLinter-eslint#installation)
Atom       | [linter-eslint](https://github.com/AtomLinter/linter-eslint#installation)
IntelliJ   | Settings » Languages & Frameworks » JavaScript » Code Quality Tools » ESLint
`vi`       | [scrooloose/syntastic](https://github.com/scrooloose/syntastic)

Another tool we use for enforcing consistent coding style is EditorConfig, which can be set up by installing a plugin in your editor that dynamically updates its configuration. Take a look at the [EditorConfig](http://editorconfig.org/#download) site to find a plugin for your editor, and browse our [`.editorconfig`](https://github.com/elastic/kibana/blob/master/.editorconfig) file to see what config rules we set up.

### Testing and Building
To ensure that your changes will not break other functionality, please run the test suite and build process before submitting your Pull Request.

Before running the tests you will need to install the projects dependencies as described above.

Once that's done, just run:

```bash
npm run test && npm run build
```

### Writing a new API (route)
The HTTP layer uses [Hono](https://hono.dev) with [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi). A Zod schema describes each request and response. The same schema validates the request at runtime and generates the OpenAPI spec served at `/swagger.json`.

1. Add a file in `src/routes/` (e.g. `example.routes.ts`):

    ```typescript
    import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
    import type { AppEnv } from '../app-env';
    import { errorResponses, json, pathParam } from './openapi';

    const ExampleResponse = z.object({ id: z.string() }).openapi('ExampleResponse');

    const getExample = createRoute({
      method: 'get',
      path: '/{id}',
      tags: ['example'],
      operationId: 'GetExample',
      request: { params: z.object({ id: pathParam('id') }) },
      responses: {
        200: json(ExampleResponse, 'Example'),
        ...errorResponses,
      },
    });

    export const exampleRoutes = new OpenAPIHono<AppEnv>()
      .openapi(getExample, async (c) => {
        const { id } = c.req.valid('param');      // validated and typed
        const server = c.get('server');           // ElastalertServer instance (services)
        return c.json({ id }, 200);
      });
    ```

2. Mount it in `src/app.ts`: `app.route('/example', exampleRoutes);`

Keep handlers thin and put the logic in a service in `src/services/`. Throw a `RequestError` subclass (`src/common/errors/`) to return an error with a specific status code. Validation errors are handled globally.

### Contributing checklist
1. **Did you [run the tests & builds as shown above](#testing-and-building) and [make sure it follows the styleguide](#linting)?**
2. **If you made a new feature, did you think about making it configurable?**
      
      Always make sure the feature can be ran on any environment by providing config options for environment specific settings. 
    > If you add a config option, check that you add it in the [config schema](../src/common/config/schema.js), the [config example](../config/config.example.json) and the [config section in readme](../README.md#config).
3. **Did you make sure you saved all your dependencies with `npm install [packageName] --save`?**
4. **Did you write tests for the code you wrote?**
    > If you have any questions about writing tests, let us know by sending an e-mail to [dev@bitsensor.io](mailto:dev@bitsensor.io).
5. **Did you document the code you wrote?**

      Especially when writing a controller with an API, please provide a little documentation on the API functions using the [JSDoc](http://usejsdoc.org/) comment style.
6. **Did you have fun writing your code?**
      
      We know that this list is quite long. If you want to contribute code but don't have the time to write tests or documentation, please mention that in the pull request. We'll still be happy with your contribution and we'll write the tests / documentation ourselves!
      
#### Thanks in advance,
#### The BitSensor Team