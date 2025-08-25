import { AiError, AiTool, AiToolkit, McpServer } from '@effect/ai'
import { CurrencyCodeSchema } from '../schema.mjs'
import { Effect, Schema } from 'effect'
import { Ynab } from '../ynab.mjs'

const ListCategoriesTool = AiTool.make('list_categories', {
  description: 'List available categories in a budget',
  parameters: {
    currencyCode: CurrencyCodeSchema.annotations({
      description: 'The currency code that identifies the budget (UYU or USD)',
    }),
  },
  success: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
    }),
  ).annotations({
    description: 'List of categories in the budget',
  }),
})

export class YnabTools extends AiToolkit.make(ListCategoriesTool) {}

export const YnabToolsLive = YnabTools.toLayer(
  Effect.gen(function* () {
    const { getCategories } = yield* Ynab
    return {
      list_categories: ({ currencyCode }) =>
        getCategories(currencyCode).pipe(
          Effect.mapError(
            (error) =>
              new AiError.AiError({
                description: 'Failed to list categories',
                module: 'Ynab',
                method: 'list_categories',
                cause: error,
              }),
          ),
        ),
    }
  }),
)

export const YnabMcpToolkit = McpServer.toolkit(YnabTools)
