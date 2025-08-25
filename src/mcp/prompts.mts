import { McpServer } from '@effect/ai'
import { Effect, Layer, Schema } from 'effect'
import { CurrencyCodeSchema, supportedCurrencyCodes } from '../schema.mjs'

const CategoriesPrompt = McpServer.prompt({
  name: 'List Categories for Currency',
  description:
    'List all categories for the budget corresponding to the currency code',
  parameters: Schema.Struct({
    currencyCode: CurrencyCodeSchema.annotations({
      description: 'The currency code that identifies the budget (UYU or USD)',
    }),
  }),
  completion: {
    currencyCode: () => Effect.succeed(supportedCurrencyCodes),
  },
  content: ({ currencyCode }) =>
    Effect.succeed(`Get all YNAB categories for the currency ${currencyCode}`),
})

export const YnabMcpPrompts = Layer.mergeAll(CategoriesPrompt)
