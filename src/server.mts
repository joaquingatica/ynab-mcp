import { NodeRuntime } from '@effect/platform-node'
import { Config, Effect, Layer, Logger, LogLevel } from 'effect'

import { Ynab } from './ynab.mjs'

import { YnabToolsLive } from './mcp/tools.mjs'
import { YnabMcpServer, YnabMcpServerLive } from './mcp/server.mjs'
import { HttpServer, HttpServerLive } from './http.mjs'

export const LogLevelLive = Config.withDefault(
  Config.logLevel('LOG_LEVEL'),
  LogLevel.Info,
).pipe(
  Effect.andThen((level) => Logger.minimumLogLevel(level)),
  Layer.unwrapEffect,
)

const ServerLayer = Layer.mergeAll(YnabMcpServer, HttpServer).pipe(
  Layer.provide(YnabToolsLive),
  Layer.provide(Ynab.Default),
  Layer.provide(YnabMcpServerLive),
  Layer.provide(LogLevelLive),
  Layer.provide(HttpServerLive),
  Layer.tapError(Effect.logError),
)

Layer.launch(ServerLayer).pipe(NodeRuntime.runMain)
