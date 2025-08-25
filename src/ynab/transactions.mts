import { Effect, Schema } from 'effect'
import type { CurrencyCode } from '../schema.mjs'

import { YnabApi, YnabApiError, YnabConfigLive } from './api.mjs'
import type { NewTransaction } from 'ynab'

export class NewTransactionInput extends Schema.Class<NewTransactionInput>(
  'NewTransactionInput',
)({
  date: Schema.String,
  amount: Schema.Number,
  categoryId: Schema.Union(Schema.String, Schema.Null),
  memo: Schema.String,
}) {}

class SaveTransactionsResponse extends Schema.Class<SaveTransactionsResponse>(
  'SaveTransactionsResponse',
)({
  data: Schema.Struct({
    transaction_ids: Schema.Array(Schema.String),
    server_knowledge: Schema.Number,
  }),
}) {}

const mapTransaction =
  (accountId: string) =>
  (transaction: NewTransactionInput): NewTransaction => ({
    account_id: accountId,
    date: transaction.date,
    amount: Math.round(transaction.amount * 1000), // YNAB API expects amounts in milliunits
    category_id: transaction.categoryId,
    memo: transaction.memo,
    approved: false,
    cleared: 'uncleared',
  })

export class YnabTransactions extends Effect.Service<YnabTransactions>()(
  'YnabTransactions',
  {
    dependencies: [YnabApi.Default],

    effect: Effect.gen(function* () {
      const ynabApi = yield* YnabApi

      const createTransactions = Effect.fn('Ynab.createTransactions')(
        function* (
          currencyCode: CurrencyCode,
          transactions: ReadonlyArray<NewTransactionInput>,
        ) {
          const { accountIds, budgetIds } = yield* YnabConfigLive
          const budgetId = budgetIds[currencyCode]
          const accountId = accountIds[currencyCode]
          return yield* Effect.tryPromise({
            try: () =>
              ynabApi.transactions.createTransactions(budgetId, {
                transactions: transactions.map(mapTransaction(accountId)),
              }),
            catch: (error) =>
              new YnabApiError({
                message: `[YNAB] Failed to create transactions: ${JSON.stringify(error)}`,
                cause: error,
              }),
          }).pipe(
            Effect.map(Schema.decodeSync(SaveTransactionsResponse)),
            Effect.map((res) => res.data.transaction_ids),
            Effect.scoped,
          )
        },
      )

      return {
        createTransactions,
      } as const
    }),
  },
) {}
