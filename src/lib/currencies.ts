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
  { name: 'Algeria',                  code: 'dz' },
  { name: 'Angola',                   code: 'ao' },
  { name: 'Benin',                    code: 'bj' },
  { name: 'Botswana',                 code: 'bw' },
  { name: 'Burkina Faso',             code: 'bf' },
  { name: 'Burundi',                  code: 'bi' },
  { name: 'Cameroon',                 code: 'cm' },
  { name: 'Cape Verde',               code: 'cv' },
  { name: 'Central African Republic', code: 'cf' },
  { name: 'Chad',                     code: 'td' },
  { name: 'Comoros',                  code: 'km' },
  { name: 'DR Congo',                 code: 'cd' },
  { name: 'Republic of Congo',        code: 'cg' },
  { name: 'Djibouti',                 code: 'dj' },
  { name: 'Egypt',                    code: 'eg' },
  { name: 'Equatorial Guinea',        code: 'gq' },
  { name: 'Eritrea',                  code: 'er' },
  { name: 'Eswatini',                 code: 'sz' },
  { name: 'Ethiopia',                 code: 'et' },
  { name: 'Gabon',                    code: 'ga' },
  { name: 'Gambia',                   code: 'gm' },
  { name: 'Ghana',                    code: 'gh' },
  { name: 'Guinea',                   code: 'gn' },
  { name: 'Guinea-Bissau',            code: 'gw' },
  { name: 'Ivory Coast',              code: 'ci' },
  { name: 'Kenya',                    code: 'ke' },
  { name: 'Lesotho',                  code: 'ls' },
  { name: 'Liberia',                  code: 'lr' },
  { name: 'Libya',                    code: 'ly' },
  { name: 'Madagascar',               code: 'mg' },
  { name: 'Malawi',                   code: 'mw' },
  { name: 'Mali',                     code: 'ml' },
  { name: 'Mauritania',               code: 'mr' },
  { name: 'Mauritius',                code: 'mu' },
  { name: 'Morocco',                  code: 'ma' },
  { name: 'Mozambique',               code: 'mz' },
  { name: 'Namibia',                  code: 'na' },
  { name: 'Niger',                    code: 'ne' },
  { name: 'Nigeria',                  code: 'ng' },
  { name: 'Rwanda',                   code: 'rw' },
  { name: 'São Tomé & Príncipe',      code: 'st' },
  { name: 'Senegal',                  code: 'sn' },
  { name: 'Seychelles',               code: 'sc' },
  { name: 'Sierra Leone',             code: 'sl' },
  { name: 'Somalia',                  code: 'so' },
  { name: 'South Africa',             code: 'za' },
  { name: 'South Sudan',              code: 'ss' },
  { name: 'Sudan',                    code: 'sd' },
  { name: 'Tanzania',                 code: 'tz' },
  { name: 'Togo',                     code: 'tg' },
  { name: 'Tunisia',                  code: 'tn' },
  { name: 'Uganda',                   code: 'ug' },
  { name: 'Zambia',                   code: 'zm' },
  { name: 'Zimbabwe',                 code: 'zw' },
] as const

export function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code}.png`
}
