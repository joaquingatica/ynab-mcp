import { AiError } from '@effect/ai'
import type { YnabApiError } from '../ynab/api.mjs'
import type { ConfigError } from 'effect'

export const parseYnabError =
  (method: string) =>
  <E extends YnabApiError | ConfigError.ConfigError>(error: E) =>
    new AiError.UnknownError({
      module: 'Ynab',
      method,
      description: error.message,
      cause: error._tag === 'YnabApiError' ? error.cause : error,
    })
