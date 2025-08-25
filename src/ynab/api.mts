import { Config, Effect, Redacted } from 'effect'
import { CurrencyCode } from '../schema.mjs'
import * as ynab from 'ynab'

export const YnabConfigLive = Config.all({
  accessToken: Config.redacted(Config.string('ACCESS_TOKEN')),
  budgetIds: Config.nested(
    Config.all({
      [CurrencyCode.UYU]: Config.string('UYU'),
      [CurrencyCode.USD]: Config.string('USD'),
    }),
    'BUDGET_ID',
  ),
}).pipe(Config.nested('YNAB'))

export class YnabApi extends Effect.Service<YnabApi>()('YnabApi', {
  effect: Effect.gen(function* () {
    const { accessToken } = yield* YnabConfigLive
    return new ynab.API(Redacted.value(accessToken))
  }),
}) {}
