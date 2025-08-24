import { McpServer } from '@effect/ai'
import manifest from '../../manifest.json' with { type: 'json' }
import { YnabTools } from './tools.mjs'

export const mcpPath = '/mcp'

export const YnabMcpServer = McpServer.toolkit(YnabTools)

export const YnabMcpServerLive = McpServer.layerHttp({
  name: manifest.display_name,
  version: manifest.version,
  path: mcpPath,
})
