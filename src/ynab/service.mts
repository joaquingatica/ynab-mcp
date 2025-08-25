import { Effect } from 'effect'
import { YnabCategories } from './categories.mjs'

export class Ynab extends Effect.Service<Ynab>()('Ynab', {
  dependencies: [YnabCategories.Default],

  effect: Effect.gen(function* () {
    const { getCategories } = yield* YnabCategories

    return { getCategories }
  }),
}) {}
