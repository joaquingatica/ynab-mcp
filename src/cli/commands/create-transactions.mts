import { Args, Command } from '@effect/cli'
import { Effect, Schema } from 'effect'

import { CurrencyCodeSchema } from '../../schema.mjs'
import { NewTransactionInput } from '../../ynab/transactions.mjs'
import { Ynab } from '../../ynab/service.mjs'
import {
  FileReadError,
  InputValidationError,
  JsonParseError,
} from '../errors.js'

const InputSchema = Schema.Struct({
  currencyCode: CurrencyCodeSchema,
  transactions: Schema.Array(NewTransactionInput),
})

const fileArg = Args.file({ name: 'input-file' }).pipe(
  Args.withDescription(
    'Path to a JSON file with currencyCode and transactions',
  ),
)

export const createTransactionsCommand = Command.make(
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
