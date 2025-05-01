# neon-mcp

This is a lightweight Model Control Protocol (MCP) server bootstrapped with [create-mcp](https://github.com/zueai/create-mcp) and deployed on Cloudflare Workers.

This MCP server allows agents (such as Cursor) to interface with the [Neon REST API](https://api-docs.neon.tech/reference/getting-started-with-neon-api).

It's still under development, I will be adding more tools as I find myself needing them.

## Installation 

1. Run the automated install script to clone this MCP server and deploy it to your Cloudflare account:

```bash
bun create mcp --clone https://github.com/zueai/neon-mcp
```

2. Open `Cursor Settings -> MCP -> Add new MCP server` and paste the command that was copied to your clipboard.

3. Upload your Neon API key to your worker secrets:

```bash
bunx wrangler secret put NEON_API_KEY
```

## Local Development

Add your Neon API key to the `.dev.vars` file:

```bash
NEON_API_KEY=<your-neon-api-key>
```

## Deploy Changes

1. Run the deploy script:

```bash
bun run deploy
```

2. Reload your Cursor window to use the updated tools.

## Available Tools

See [src/index.ts](src/index.ts) for the current list of tools.

## Learn More

- [Model Control Protocol Documentation](https://modelcontextprotocol.io)
- [create-mcp Documentation](https://github.com/zueai/create-mcp)
- [workers-mcp](https://github.com/cloudflare/workers-mcp)
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
- [Neon API Documentation](https://api-docs.neon.tech/reference/getting-started-with-neon-api)
