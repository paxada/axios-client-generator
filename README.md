# axios-client-generator
Create an axios client package from a paxada project.

### Initialization
`npm i -D @paxada/axios-client-generator`

Add in your `package.json`, in `"scripts"` field :
```
"generate:client": "paxada-axios-client-generate",
"client:publish": "cd {packageName} && npm run build && npm publish" 
```

### Check your paxada project
- Every route need a `.interface.ts` file.
- Check well `.doc.ts`.

### Generate the client
Run `npm run generate:client` to generate the client.\
It will patch the client version if the client already existed.

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
- **folderName**: The folder name of the generated client.
- **packageName**: The name in the package.json of the generated client.
- **extraExports**: Paths from your utils files in your project to export in the generated client.
- **includedRoutes**: Routes to include, the others will be excluded (from src/routes, ex: 'private/Companies').
- **excludedRoutes**: Routes to exclude, the others will be included (from src/routes, ex: 'admin').

### Publish
`npm run client:publish`

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