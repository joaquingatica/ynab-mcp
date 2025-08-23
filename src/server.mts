import { AiError, AiTool, AiToolkit, McpServer } from '@effect/ai'
import { HttpRouter } from '@effect/platform'
import { NodeHttpServer, NodeRuntime } from '@effect/platform-node'
import {
  Config,
  Effect,
  Layer,
  Logger,
  LogLevel,
  Redacted,
  Schema,
} from 'effect'
import * as ynab from 'ynab'
import { createServer } from 'node:http'

const CurrencyCode = {
  UYU: 'UYU',
  USD: 'USD',
} as const
type CurrencyCode = (typeof CurrencyCode)[keyof typeof CurrencyCode]
const CurrencyCodeSchema = Schema.Enums(CurrencyCode)

const YnabConfigLive = Config.all({
  accessToken: Config.redacted(Config.string('ACCESS_TOKEN')),
  budgetIds: Config.nested(
    Config.all({
      [CurrencyCode.UYU]: Config.string('UYU'),
      [CurrencyCode.USD]: Config.string('USD'),
    }),
    'BUDGET_ID',
  ),
}).pipe(Config.nested('YNAB'))

const LogLevelLive = Config.withDefault(
  Config.logLevel('LOG_LEVEL'),
  LogLevel.Info,
).pipe(
  Effect.andThen((level) => Logger.minimumLogLevel(level)),
  Layer.unwrapEffect,
)

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

class Ynab extends Effect.Service<Ynab>()('Ynab', {
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

    return {
      getCategories,
    } as const
  }),
}) {}

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

class YnabTools extends AiToolkit.make(ListCategoriesTool) {}

const YnabToolHandlers = YnabTools.toLayer(
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

// Merge all the resources and prompts into a single server layer
const ServerLayer = Layer.mergeAll(
  McpServer.toolkit(YnabTools),
  HttpRouter.Default.serve(),
).pipe(
  Layer.provide(YnabToolHandlers),
  Layer.provide(Ynab.Default),
  Layer.provide(
    McpServer.layerHttp({
      name: 'Demo Server',
      version: '1.0.0',
      path: '/mcp',
    }),
  ),
  Layer.provide(LogLevelLive),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
)

Layer.launch(ServerLayer).pipe(NodeRuntime.runMain)
