# ynab-mcp

## Setup/Requirements:

- Nix and direnv
- Use direnv to load environment variables from `.env` file.

or

- Node.js 22
- `jq`
- `dotenv-cli`
- Use `npx dotenv -- npm run start` to run the app with environment variables loaded.

## Usage

To launch the app, run `npm start`.

To test it, run the following command `npx @modelcontextprotocol/inspector` and open the URL printed.
In the inspector interface, use `Streamable HTTP` with `http://localhost:3000/mcp` as the URL.
