import { McpServer } from '@effect/ai'
import manifest from '../../manifest.json' with { type: 'json' }
import { YnabMcpToolkit } from './tools.mjs'
import { Layer } from 'effect'
import { YnabMcpPrompts } from './prompts.mjs'
import { NodeSink, NodeStream } from '@effect/platform-node'

export const mcpPath = '/mcp'

export const YnabMcpServer = Layer.mergeAll(YnabMcpPrompts, YnabMcpToolkit)

export const YnabMcpServerHttp = McpServer.layerHttp({
  name: manifest.display_name,
  version: manifest.version,
  path: mcpPath,
})

export const YnabMcpServerStdio = McpServer.layerStdio({
  name: manifest.display_name,
  version: manifest.version,
  stdin: NodeStream.stdin,
  stdout: NodeSink.stdout,
})
