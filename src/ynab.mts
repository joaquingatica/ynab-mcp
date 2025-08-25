import { Config, Effect, Redacted, Schema } from 'effect'
import * as ynab from 'ynab'
import { CurrencyCode } from './schema.mjs'

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

class YnabApi extends Effect.Service<YnabApi>()('ListCategoriesService', {
  effect: Effect.gen(function* () {
    const { accessToken } = yield* YnabConfigLive
    return new ynab.API(Redacted.value(accessToken))
  }),
}) {}

class Category extends Schema.Class<Category>('Category')({
  id: Schema.String,
  name: Schema.String,
  hidden: Schema.Boolean,
  deleted: Schema.Boolean,
}) {}

class CategoryGroup extends Schema.Class<CategoryGroup>('CategoryGroup')({
  id: Schema.String,
  name: Schema.String,
  hidden: Schema.Boolean,
  deleted: Schema.Boolean,
  categories: Schema.Array(Category),
}) {}

const isActiveCategory = ({
  deleted,
  hidden,
}: {
  deleted: boolean
  hidden: boolean
}) => !hidden && !deleted

class GetCategoriesResponse extends Schema.Class<GetCategoriesResponse>(
  'GetCategoriesResponse',
)({
  data: Schema.Struct({
    category_groups: Schema.Array(CategoryGroup),
  }),
}) {}

class GetCategoryByIdResponse extends Schema.Class<GetCategoryByIdResponse>(
  'GetCategoryByIdResponse',
)({
  data: Schema.Struct({
    category: Category,
  }),
}) {}

export class Ynab extends Effect.Service<Ynab>()('Ynab', {
  dependencies: [YnabApi.Default],

  effect: Effect.gen(function* () {
    const ynabApi = yield* YnabApi

    const getCategories = Effect.fn('Ynab.getCategories')(function* (
      currencyCode: CurrencyCode,
    ) {
      const { budgetIds } = yield* YnabConfigLive
      const budgetId = budgetIds[currencyCode]
      return yield* Effect.tryPromise(() =>
        ynabApi.categories.getCategories(budgetId),
      ).pipe(
        Effect.map(Schema.decodeSync(GetCategoriesResponse)),
        Effect.map((res) =>
          res.data.category_groups
            .filter(isActiveCategory)
            .flatMap(({ categories }) =>
              categories
                .filter(isActiveCategory)
                .map(({ id, name }) => ({ id, name })),
            ),
        ),
        Effect.scoped,
        Effect.orDie,
      )
    })

    const getCategoryById = Effect.fn('Ynab.getCategoryById')(function* (
      currencyCode: CurrencyCode,
      categoryId: string,
    ) {
      const { budgetIds } = yield* YnabConfigLive
      const budgetId = budgetIds[currencyCode]
      return yield* Effect.tryPromise(() =>
        ynabApi.categories.getCategoryById(budgetId, categoryId),
      ).pipe(
        Effect.map(Schema.decodeSync(GetCategoryByIdResponse)),
        Effect.flatMap((response) =>
          isActiveCategory(response.data.category)
            ? Effect.succeed(response.data.category)
            : Effect.fail(new Error('Category is inactive')),
        ),
        Effect.map(({ id, name }) => ({ id, name })),
        Effect.scoped,
        Effect.orDie,
      )
    })

    return {
      getCategories,
      getCategoryById,
    } as const
  }),
}) {}
