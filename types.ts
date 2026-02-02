
export type CountryCode = 'SG' | 'MY' | 'PH' | 'VN' | 'TH' | 'TW' | 'BR' | 'MX';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  currency: string;
  defaultExchangeRate: number;
  flag: string;
}

export interface CalculatorInputs {
  productName: string;
  countryCode: CountryCode;
  costKRW: number;
  sellingPriceLocal: number;
  shippingKRW: number;
  exchangeRate: number;
  feeRate: number;
}

export interface CalculationResult {
  revenueKRW: number;
  marketFeeKRW: number;
  totalExpensesKRW: number;
  netProfitKRW: number;
  marginRate: number;
  localCurrency: string;
}
