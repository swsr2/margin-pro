
export const formatCurrency = (value: number, currency: string): string => {
  const localeMap: Record<string, string> = {
    KRW: 'ko-KR',
    SGD: 'en-SG',
    MYR: 'en-MY',
    PHP: 'en-PH',
    VND: 'vi-VN',
    THB: 'th-TH',
    TWD: 'zh-TW',
    BRL: 'pt-BR',
    MXN: 'es-MX',
  };

  return new Intl.NumberFormat(localeMap[currency] || 'en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: (currency === 'KRW' || currency === 'VND' || currency === 'TWD') ? 0 : 2,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};
