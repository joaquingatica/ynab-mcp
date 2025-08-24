import { Config, Effect, Layer } from 'effect'

import { NodeHttpServer } from '@effect/platform-node'
import { createServer } from 'node:http'
import { mcpPath } from './mcp/server.mjs'
import { HttpRouter } from '@effect/platform'

export const PortConfig = Config.withDefault(Config.port('PORT'), 3000)

export const HttpServer = HttpRouter.Default.serve()

export const HttpServerLive = Effect.gen(function* () {
  const port = yield* PortConfig
  return NodeHttpServer.layer(createServer, { port })
}).pipe(
  Effect.tap(() =>
    Effect.gen(function* () {
      const port = yield* PortConfig
      yield* Effect.logInfo(
        `Server started on http://localhost:${port}${mcpPath}`,
      )
    }),
  ),
  Layer.unwrapEffect,
)
