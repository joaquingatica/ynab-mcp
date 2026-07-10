import { Data } from 'effect'
import type { ParseResult } from 'effect'

export class FileReadError extends Data.TaggedError('FileReadError')<{
  path: string
  cause: unknown
}> {}

export class JsonParseError extends Data.TaggedError('JsonParseError')<{
  cause: unknown
}> {}

export class InputValidationError extends Data.TaggedError(
  'InputValidationError',
)<{
  issue: ParseResult.ParseError
}> {}

export class FileWriteError extends Data.TaggedError('FileWriteError')<{
  path: string
  cause: unknown
}> {}
