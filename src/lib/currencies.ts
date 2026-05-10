export const AFRICAN_CURRENCIES = [
  { code: 'USD', symbol: '$',    name: 'US Dollar (Universal)' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'ETB', symbol: 'Br',  name: 'Ethiopian Birr' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
  { code: 'XAF', symbol: 'CFA', name: 'Central African CFA Franc' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
  { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound' },
  { code: 'DZD', symbol: 'DA',  name: 'Algerian Dinar' },
  { code: 'TND', symbol: 'DT',  name: 'Tunisian Dinar' },
  { code: 'LYD', symbol: 'LD',  name: 'Libyan Dinar' },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc' },
  { code: 'MZN', symbol: 'MT',  name: 'Mozambican Metical' },
  { code: 'BWP', symbol: 'P',   name: 'Botswanan Pula' },
  { code: 'ZMW', symbol: 'ZK',  name: 'Zambian Kwacha' },
  { code: 'AOA', symbol: 'Kz',  name: 'Angolan Kwanza' },
  { code: 'CDF', symbol: 'FC',  name: 'Congolese Franc' },
  { code: 'MGA', symbol: 'Ar',  name: 'Malagasy Ariary' },
  { code: 'MWK', symbol: 'MK',  name: 'Malawian Kwacha' },
  { code: 'NAD', symbol: 'N$',  name: 'Namibian Dollar' },
  { code: 'SZL', symbol: 'L',   name: 'Swazi Lilangeni' },
  { code: 'SLL', symbol: 'Le',  name: 'Sierra Leonean Leone' },
  { code: 'GMD', symbol: 'D',   name: 'Gambian Dalasi' },
  { code: 'MUR', symbol: '₨',   name: 'Mauritian Rupee' },
  { code: 'SDG', symbol: 'SDG', name: 'Sudanese Pound' },
  { code: 'SOS', symbol: 'Sh',  name: 'Somali Shilling' },
] as const

export type CurrencyCode = typeof AFRICAN_CURRENCIES[number]['code']

export function getCurrencySymbol(code: string | null | undefined): string {
  if (!code) return '$'
  return AFRICAN_CURRENCIES.find(c => c.code === code)?.symbol ?? code
}

export function formatPrice(price: number, currencyCode: string | null | undefined): string {
  return `${getCurrencySymbol(currencyCode)}${price.toLocaleString()}`
}

export const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
  'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Comoros',
  'DR Congo', 'Republic of Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea',
  'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea',
  'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya',
  'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco',
  'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'São Tomé & Príncipe',
  'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa',
  'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda',
  'Zambia', 'Zimbabwe',
]
