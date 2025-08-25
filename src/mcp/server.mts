import { McpServer } from '@effect/ai'
import manifest from '../../manifest.json' with { type: 'json' }
import { YnabMcpToolkit } from './tools.mjs'
import { Layer } from 'effect'
import { YnabMcpResources } from './resources.mjs'
import { YnabMcpPrompts } from './prompts.mjs'

export const mcpPath = '/mcp'

export const YnabMcpServer = Layer.mergeAll(
  YnabMcpPrompts,
  YnabMcpResources,
  YnabMcpToolkit,
)

export const YnabMcpServerLive = McpServer.layerHttp({
  name: manifest.display_name,
  version: manifest.version,
  path: mcpPath,
})
