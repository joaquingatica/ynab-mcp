import { Effect } from 'effect'
import { YnabCategories } from './categories.mjs'
import { YnabTransactions } from './transactions.mjs'

export class Ynab extends Effect.Service<Ynab>()('Ynab', {
  dependencies: [YnabCategories.Default, YnabTransactions.Default],

  effect: Effect.gen(function* () {
    const { getCategories } = yield* YnabCategories
    const { createTransactions } = yield* YnabTransactions

    return { getCategories, createTransactions }
  }),
}) {}
