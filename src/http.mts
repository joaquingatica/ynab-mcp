import { Config, Effect, Layer } from 'effect'

import { NodeHttpServer } from '@effect/platform-node'
import { createServer } from 'node:http'
import { HttpRouter } from '@effect/platform'

export const PortConfig = Config.withDefault(Config.port('PORT'), 3000)

export const HttpServer = HttpRouter.Default.serve()

export const HttpServerLive = Effect.gen(function* () {
  const port = yield* PortConfig
  return NodeHttpServer.layer(createServer, { port })
}).pipe(Layer.unwrapEffect)
