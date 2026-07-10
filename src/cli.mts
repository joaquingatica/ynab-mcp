import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Args, Command, ValidationError } from '@effect/cli'
import { Config, Data, Effect, Layer, Logger, LogLevel, Schema } from 'effect'
import type { ParseResult } from 'effect'

import { CurrencyCodeSchema } from './schema.mjs'
import { NewTransactionInput } from './ynab/transactions.mjs'
import { Ynab } from './ynab/service.mjs'

class FileReadError extends Data.TaggedError('FileReadError')<{
  path: string
  cause: unknown
}> {}

class JsonParseError extends Data.TaggedError('JsonParseError')<{
  cause: unknown
}> {}

class InputValidationError extends Data.TaggedError('InputValidationError')<{
  issue: ParseResult.ParseError
}> {}

const InputSchema = Schema.Struct({
  currencyCode: CurrencyCodeSchema,
  transactions: Schema.Array(NewTransactionInput),
})

const LogLevelLive = Config.withDefault(
  Config.logLevel('LOG_LEVEL'),
  LogLevel.Info,
).pipe(
  Effect.andThen((level) => Logger.minimumLogLevel(level)),
  Layer.unwrapEffect,
)

const fileArg = Args.file({ name: 'input-file' }).pipe(
  Args.withDescription(
    'Path to a JSON file with currencyCode and transactions',
  ),
)

const createTransactionsCommand = Command.make(
  'create-transactions',
  { file: fileArg },
  ({ file }) =>
    Effect.gen(function* () {
      const fs = yield* Effect.promise(() => import('node:fs/promises'))
      const raw = yield* Effect.tryPromise({
        try: () => fs.readFile(file, 'utf-8'),
        catch: (cause) => new FileReadError({ path: file, cause }),
      })

      const json = yield* Effect.try({
        try: () => JSON.parse(raw) as unknown,
        catch: (cause) => new JsonParseError({ cause }),
      })

      const input = yield* Schema.decodeUnknown(InputSchema)(json).pipe(
        Effect.mapError((issue) => new InputValidationError({ issue })),
      )

      yield* Effect.logInfo(
        `Creating ${input.transactions.length} transaction(s) for ${input.currencyCode}...`,
      )

      const { createTransactions } = yield* Ynab
      const ids = yield* createTransactions(
        input.currencyCode,
        input.transactions,
      )

      yield* Effect.logInfo(`Created ${ids.length} transaction(s):`)
      for (const id of ids) {
        yield* Effect.logInfo(`  - ${id}`)
      }
    }),
)

const MainLayer = Ynab.Default.pipe(
  Layer.provide(LogLevelLive),
  Layer.provide(Logger.add(Logger.prettyLogger({ stderr: true }))),
)

const program = Command.run(createTransactionsCommand, {
  name: 'ynab-cli',
  version: '1.0.0',
})(process.argv).pipe(
  Effect.catchTags({
    FileReadError: (e) =>
      Effect.logError(`Cannot read file "${e.path}": ${e.cause}`),
    JsonParseError: (e) => Effect.logError(`Invalid JSON: ${e.cause}`),
    InputValidationError: (e) =>
      Effect.logError(`Invalid input:\n${e.issue.message}`),
  }),
  // ValidationError is already printed by @effect/cli before failing
  Effect.catchIf(ValidationError.isValidationError, () => Effect.void),
  Effect.provide(Layer.merge(MainLayer, NodeContext.layer)),
)

NodeRuntime.runMain(program)
