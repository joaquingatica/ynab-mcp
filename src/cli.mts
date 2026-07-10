import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Command, ValidationError } from '@effect/cli'
import { Config, Effect, Layer, Logger, LogLevel } from 'effect'

import { Ynab } from './ynab/service.mjs'
import { createTransactionsCommand } from './cli/commands/create-transactions.mjs'
import { listCategoriesCommand } from './cli/commands/list-categories.mjs'

const LogLevelLive = Config.withDefault(
  Config.logLevel('LOG_LEVEL'),
  LogLevel.Info,
).pipe(
  Effect.andThen((level) => Logger.minimumLogLevel(level)),
  Layer.unwrapEffect,
)

const MainLayer = Ynab.Default.pipe(
  Layer.provide(LogLevelLive),
  Layer.provide(
    Logger.replace(Logger.defaultLogger, Logger.prettyLogger({ stderr: true })),
  ),
)

const rootCommand = Command.make('ynab-cli').pipe(
  Command.withSubcommands([createTransactionsCommand, listCategoriesCommand]),
)

const program = Command.run(rootCommand, {
  name: 'ynab-cli',
  version: '1.0.0',
})(process.argv).pipe(
  Effect.catchTags({
    FileReadError: (e) =>
      Effect.logError(`Cannot read file "${e.path}": ${e.cause}`),
    FileWriteError: (e) =>
      Effect.logError(`Cannot write file "${e.path}": ${e.cause}`),
    JsonParseError: (e) => Effect.logError(`Invalid JSON: ${e.cause}`),
    InputValidationError: (e) =>
      Effect.logError(`Invalid input:\n${e.issue.message}`),
  }),
  // ValidationError is already printed by @effect/cli before failing
  Effect.catchIf(ValidationError.isValidationError, () => Effect.void),
  Effect.provide(Layer.merge(MainLayer, NodeContext.layer)),
)

NodeRuntime.runMain(program, { disablePrettyLogger: true })
