import { AiError, McpSchema, McpServer } from '@effect/ai'
import { CurrencyCodeSchema, supportedCurrencyCodes } from '../schema.mjs'
import { Array, Effect, Layer, Schema } from 'effect'
import { Ynab } from '../ynab.mjs'

const currencyCodeParam = McpSchema.param(
  'currencyCode',
  CurrencyCodeSchema.annotations({
    description: 'The currency code that identifies the budget (UYU or USD)',
  }),
)

const categoryIdParam = McpSchema.param(
  'categoryId',
  Schema.String.annotations({
    description: 'The ID of the category',
  }),
)

const CategoriesResource = McpServer.resource`category://${currencyCodeParam}`({
  name: 'Categories',
  completion: {
    currencyCode: (_) => Effect.succeed(supportedCurrencyCodes),
  },
  content: Effect.fn(function* (_uri, currencyCode) {
    const { getCategories } = yield* Ynab
    return yield* getCategories(currencyCode).pipe(
      Effect.map(
        Array.map((category) => ({
          text: JSON.stringify(category),
          uri: `category://${currencyCode}/${category.id}`,
        })),
      ),
      Effect.map((contents) => ({ contents })),
      Effect.mapError(
        (error) =>
          new AiError.AiError({
            description: 'Failed to list categories',
            module: 'Ynab',
            method: 'categories_resource',
            cause: error,
          }),
      ),
    )
  }),
})

const CategoryResource =
  McpServer.resource`category://${currencyCodeParam}/${categoryIdParam}`({
    name: 'Category',
    completion: {
      currencyCode: (_) => Effect.succeed(supportedCurrencyCodes),
    },
    content: Effect.fn(function* (_uri, currencyCode, categoryId) {
      const { getCategoryById } = yield* Ynab
      return yield* getCategoryById(currencyCode, categoryId).pipe(
        Effect.map((category) => JSON.stringify(category)),
        Effect.mapError(
          (error) =>
            new AiError.AiError({
              description: 'Failed to fetch category',
              module: 'Ynab',
              method: 'category_resource',
              cause: error,
            }),
        ),
      )
    }),
  })

export const YnabMcpResources = Layer.mergeAll(
  CategoriesResource,
  CategoryResource,
)
