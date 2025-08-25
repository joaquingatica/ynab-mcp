import { Schema } from 'effect'

export const CurrencyCode = {
  UYU: 'UYU',
  USD: 'USD',
} as const
export type CurrencyCode = (typeof CurrencyCode)[keyof typeof CurrencyCode]

export const CurrencyCodeSchema = Schema.Enums(CurrencyCode)

export const supportedCurrencyCodes = [CurrencyCode.UYU, CurrencyCode.USD]
