import { Command, Options } from '@effect/cli'
import { Effect } from 'effect'

import { supportedCurrencyCodes } from '../../schema.mjs'
import { Ynab } from '../../ynab/service.mjs'
import { FileWriteError } from '../errors.js'
import { formatCategories } from '../format.mjs'

const currencyOption = Options.choice('currency', supportedCurrencyCodes).pipe(
  Options.withDescription(
    'The currency code that identifies the budget (UYU or USD)',
  ),
)

const outputOption = Options.file('output').pipe(
  Options.withDescription('Path to write the output file'),
)

const formatOption = Options.choice('format', [
  'json',
  'csv',
  'markdown',
] as const).pipe(
  Options.withDescription('Output format'),
  Options.withDefault('markdown' as const),
)

export const listCategoriesCommand = Command.make(
  'list-categories',
  { currency: currencyOption, format: formatOption, output: outputOption },
  ({ currency, format, output }) =>
    Effect.gen(function* () {
      const fs = yield* Effect.promise(() => import('node:fs/promises'))
      const { getCategories } = yield* Ynab
      const categories = yield* getCategories(currency)
      const content = formatCategories(categories, format)
      yield* Effect.tryPromise({
        try: () => fs.writeFile(output, content),
        catch: (cause) => new FileWriteError({ path: output, cause }),
      })
      yield* Effect.logInfo(
        `Wrote ${categories.length} categories to ${output}`,
      )
    }),
)
