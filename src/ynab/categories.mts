import { Effect, Schema } from 'effect'
import type { CurrencyCode } from '../schema.mjs'

import { YnabApi, YnabConfigLive } from './api.mjs'

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

export class YnabCategories extends Effect.Service<YnabCategories>()(
  'YnabCategories',
  {
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
              .flatMap(({ categories, id: groupId, name: groupName }) =>
                categories.filter(isActiveCategory).map(({ id, name }) => ({
                  id,
                  name,
                  group: { id: groupId, name: groupName },
                })),
              ),
          ),
          Effect.scoped,
          Effect.orDie,
        )
      })

      return {
        getCategories,
      } as const
    }),
  },
) {}
