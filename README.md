# axios-client-generator
Create an axios client package from a paxada project.

### What you need before
- You need a project generated by [Paxada](https://www.npmjs.com/package/paxada).
- All your `.doc.ts` route file should be up-to-date.
- All the `.route.ts` of the project should have a different name, even between different folders.
- In your `.interface.ts` files in the `routes` folder do not use type that just returns `void`.

### Initialization
`npm i -D @paxada/axios-client-generator`

Add in your `package.json`, in `"scripts"` field :
```
"generate:client": "paxada-axios-client-generate",
"publish:client": "cd {packageName} && npm run package-publish" 
```

### Check your paxada project
- Every route need a `.interface.ts` file.
- Check well `.doc.ts`.
- Check tha your TypeScript compiles by using `npm run checkTs`.

### Generate the client
Run `npm run generate:client` to generate the client.

### Configs
Add a `axiosClient.config.json` file at the root project.
```json
{
  "folderName": "string",
  "packageName": "string",
  "extraExports": "[string]",
  "excludedRoutes": "[string]",
  "includedRoutes": "[string]" 
}
```
All fields are optional.
- **folderName**: The folder name of the generated client. Default: ${projectName}-client.
- **packageName**: The name in the package.json of the generated client. . Default: ${projectName}-client
- **extraExports**: Paths from your utils files in your project to export in the generated client.
- **includedRoutes**: Routes to include, the others will be excluded (from src/routes, ex: 'private/Companies').
- **excludedRoutes**: Routes to exclude, the others will be included (from src/routes, ex: 'admin').

### CLI options
`paxada-axios-client-generator -h`
```
-e, --extra-export <paths...> Add extra export paths
-fn, --folder-name <string> Package alias in package.json name
-ir, --included-route <routes...> Included routes from src/routes
-er, --excluded-routes <routes...> Excluded routes from src/routes
-pn, --package-name <string> Package name
-cf, --config-file <string> Config .json file to generate the route. Default: axiosClient.config.json
```
Exemple: \
`paxada-axios-generate -fn bouncer-client -pn @waapi/bouncer-client -e src/clientUtils/index.ts`\
\
**CLI options will overwrite the `axiosClient.config.json` data.**

### Publish
`npm run publish:client` \
It will automatically patch the package version.

### Warning
You should never update the generated client's code but the package version.\
It will be overwritten anyway at the next generation.\
The client catch the request errors so the methods will never throw. Instead, you should refer to the `hasFailed` and `error` fields of the promise response.

### Initialize your client package on another project
Example:\
`src/loaders/myProjectClient.ts`
```typescript
import { getAxiosClient, AxiosClient } from '@waapi/myProject-client';
import { MY_PROJECT_API_URL } from '@/config';

let myProjectClient: AxiosClient | undefined;

const createMyProjectClient = (url: string) => {
    return getAxiosClient({ baseUrl: url, headers: {} });
};

export const getMyProjectClient = (): AxiosClient => {
    if (myProjectClient === undefined) {
        if (MY_PROJECT_API_URL === undefined) throw new Error('Missing MY_PROJECT_API_URL');
        myProjectClient = createMyProjectClient(MY_PROJECT_API_URL);
    }
    return myProjectClient;
};

```

### Response type
```typescript
type Response<Data> = 
    | { hasFailed: true; error: { code: string; message: string } }
    | { hasFailed: false; data: Data }
```

### Initialize your client mock method on another project
`src/helpers/mockMyProjectClient`
```typescript
import { mockAxiosClient } from '@waapi/myProject-client';
import * as myProjectClient from '../loaders/myProjectClient';

export const mockMyProjectClient = () => {
    const mocked = mockAxiosClient<jest.Mock>(jest.fn);
    jest.spyOn(myProjectClient, 'getMyProjectClient').mockReturnValue(mocked);
    return mocked;
};

```

### How to use the client mock
`.test.ts` file
```typescript
import { mockMyProjectClient } from '@/helpers/mockMyProjectClient';
import { getMyProjectClient } from '@/loaders/myProjectClient';

const doSomething = async () => {
    const myProjectClient = getMyProjectClient()
    const response = await myProjectClient.setHeaders({ machin: "chouette" }).private.entity.getMethod();
    if (data.hasFailed) return "error";
    return response.data;
}

describe(() => {
    it ("Should call the mocked method", async () => {
        const myProjectClientMock = mockMyProjectClient();
        myProjectClientMock.private.entity.getMethod.mockResolvedValue({ hasFailed: false, data: "bidule" });
        
        const result = await doSomething();
        
        expect(myProjectClientMock.private.entity.getMethod).toHaveBeenCalled();
        expect(result).toBe("bidule");
    })
})
```
