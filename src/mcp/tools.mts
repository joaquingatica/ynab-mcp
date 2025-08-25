import { AiTool, AiToolkit, McpServer } from '@effect/ai'
import { CurrencyCodeSchema } from '../schema.mjs'
import { Effect, Schema } from 'effect'
import { Ynab } from '../ynab/service.mjs'
import { NewTransactionInput } from '../ynab/transactions.mjs'
import { parseYnabError } from './errors.js'

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
      group: Schema.Struct({
        id: Schema.String,
        name: Schema.String,
      }),
    }),
  ).annotations({
    description: 'List of categories in the budget',
  }),
})

const CreateTransactionsTool = AiTool.make('create_transactions', {
  description: 'Create transactions in a budget',
  parameters: {
    currencyCode: CurrencyCodeSchema.annotations({
      description: 'The currency code that identifies the budget (UYU or USD)',
    }),
    transactions: Schema.Array(NewTransactionInput).annotations({
      description: 'List of transactions to create',
    }),
  },
  success: Schema.Array(Schema.String).annotations({
    description: 'List of created transaction IDs',
  }),
})

export class YnabTools extends AiToolkit.make(
  ListCategoriesTool,
  CreateTransactionsTool,
) {}

export const YnabToolsLive = YnabTools.toLayer(
  Effect.gen(function* () {
    const { createTransactions, getCategories } = yield* Ynab
    return {
      list_categories: ({ currencyCode }) =>
        getCategories(currencyCode).pipe(
          Effect.mapError(parseYnabError('list_categories')),
        ),

      create_transactions: ({ currencyCode, transactions }) =>
        createTransactions(currencyCode, transactions).pipe(
          Effect.mapError(parseYnabError('create_transactions')),
        ),
    }
  }),
)

export const YnabMcpToolkit = McpServer.toolkit(YnabTools)
