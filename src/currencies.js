import { formCurrency } from './currency.js'

let currencyIconCache = null

export function getCurrencies() {
    if (currencyIconCache) return currencyIconCache

    const icons = {
        // List compiled from external website
        // Source: https://www.xe.com/symbols/
        'ALL': formCurrency('ALL', { isPost: true, items: [76, 101, 107] }),
        'AFN': formCurrency('AFN', { isPost: true, items: [1547] }),
        'ARS': formCurrency('ARS', [36]),
        'AWG': formCurrency('AWG', { isPost: true, items: [402] }),
        'AUD': formCurrency('AUD', [36]),
        'AZN': formCurrency('AZN', { isPost: true, items: [8380] }),
        'BSD': formCurrency('BSD', [36]),
        'BBD': formCurrency('BBD', [36]),
        'BYN': formCurrency('BYN', { isPost: true, items: [66, 114] }),
        'BZD': formCurrency('BZD', { prefix: 'BZ', items: [36] }),
        'BMD': formCurrency('BMD', [36]),
        'BOB': formCurrency('BOB', { isPost: true, items: [36, 98] }),
        'BAM': formCurrency('BAM', { isPost: true, items: [75, 77] }),
        'BWP': formCurrency('BWP', { isPost: true, items: [80] }),
        'BGN': formCurrency('BGN', { isPost: true, items: [1083, 1074] }),
        'BRL': formCurrency('BRL', { prefix: 'R', items: [36] }),
        'BND': formCurrency('BND', [36]),
        'KHR': formCurrency('KHR', { isPost: true, items: [6107] }),
        'CAD': formCurrency('CAD', [36]),
        'KYD': formCurrency('KYD', [36]),
        'CLP': formCurrency('CLP', [36]),
        'CNY': formCurrency('CNY', [165]),
        'COP': formCurrency('COP', [36]),
        'CRC': formCurrency('CRC', [8353]),
        'HRK': formCurrency('HRK', { isPost: true, items: [107, 110] }),
        'CUP': formCurrency('CUP', [8369]),
        'CZK': formCurrency('CZK', { isPost: true, items: [75, 269] }),
        'DKK': formCurrency('DKK', { isPost: true, items: [107, 114] }),
        'DOP': formCurrency('DOP', { prefix: 'RD', items: [36] }),
        'XCD': formCurrency('XCD', [36]),
        'EGP': formCurrency('EGP', [163]),
        'SVC': formCurrency('SVC', [36]),
        'EUR': formCurrency('EUR', [8364]),
        'FKP': formCurrency('FKP', [163]),
        'FJD': formCurrency('FJD', [36]),
        'GHS': formCurrency('GHS', [162]),
        'GIP': formCurrency('GIP', [163]),
        'GTQ': formCurrency('GTQ', { isPost: true, items: [81] }),
        'GGP': formCurrency('GGP', [163]),
        'GYD': formCurrency('GYD', [36]),
        'HNL': formCurrency('HNL', { isPost: true, items: [76] }),
        'HKD': formCurrency('HKD', [36]),
        'HUF': formCurrency('HUF', { isPost: true, items: [70, 116] }),
        'ISK': formCurrency('ISK', { isPost: true, items: [107, 114] }),
        'INR': formCurrency('INR', [8377]),
        'IDR': formCurrency('IDR', { isPost: true, items: [82, 112] }),
        'IRR': formCurrency('IRR', [65020]),
        'IMP': formCurrency('IMP', [163]),
        'ILS': formCurrency('ILS', [8362]),
        'JMD': formCurrency('JMD', [74, 36]),
        'JPY': formCurrency('JPY', [165]),
        'JEP': formCurrency('JEP', [163]),
        'KZT': formCurrency('KZT', { isPost: true, items: [1083, 1074] }),
        'KPW': formCurrency('KPW', [8361]),
        'KRW': formCurrency('KRW', [8361]),
        'KGS': formCurrency('KGS', { isPost: true, items: [1083, 1074] }),
        'LAK': formCurrency('LAK', [8365]),
        'LBP': formCurrency('LBP', [163]),
        'LRD': formCurrency('LRD', [36]),
        'MKD': formCurrency('MKD', { isPost: true, items: [1076, 1077, 1085] }),
        'MYR': formCurrency('MYR', { isPost: true, items: [82, 77] }),
        'MUR': formCurrency('MUR', [8360]),
        'MXN': formCurrency('MXN', [36]),
        'MNT': formCurrency('MNT', [8366]),
        'MZN': formCurrency('MZN', { isPost: true, items: [77, 84] }),
        'NAD': formCurrency('NAD', [36]),
        'NPR': formCurrency('NPR', [8360]),
        'ANG': formCurrency('ANG', { isPost: true, items: [402] }),
        'NZD': formCurrency('NZD', [36]),
        'NIO': formCurrency('NIO', { prefix: 'C', items: [36] }),
        'NGN': formCurrency('NGN', [8358]),
        'NOK': formCurrency('NOK', { isPost: true, items: [107, 114] }),
        'OMR': formCurrency('OMR', [65020]),
        'PKR': formCurrency('PKR', [8360]),
        'PAB': formCurrency('PAB', [66, 47, 46]),
        'PYG': formCurrency('PYG', { isPost: true, items: [71, 115] }),
        'PEN': formCurrency('PEN', [83, 47, 46]),
        'PHP': formCurrency('PHP', [8369]),
        'PLN': formCurrency('PLN', { isPost: true, items: [122, 322] }),
        'QAR': formCurrency('QAR', [65020]),
        'RON': formCurrency('RON', { isPost: true, items: [108, 101, 105] }),
        'RUB': formCurrency('RUB', [8381]),
        'SHP': formCurrency('SHP', [163]),
        'SAR': formCurrency('SAR', [65020]),
        'RSD': formCurrency('RSD', { isPost: true, items: [1044, 1080, 1085, 46] }),
        'SCR': formCurrency('SCR', [8360]),
        'SGD': formCurrency('SGD', [36]),
        'SBD': formCurrency('SBD', [36]),
        'SOS': formCurrency('SOS', { isPost: true, items: [83] }),
        'ZAR': formCurrency('ZAR', { isPost: true, items: [82] }),
        'LKR': formCurrency('LKR', [8360]),
        'SEK': formCurrency('SEK', { isPost: true, items: [107, 114] }),
        'CHF': formCurrency('CHF', { isPost: true, items: [67, 72, 70] }),
        'SRD': formCurrency('SRD', [36]),
        'SYP': formCurrency('SYP', [163]),
        'TWD': formCurrency('TWD', { prefix: 'NT', items: [36] }),
        'THB': formCurrency('THB', [3647]),
        'TTD': formCurrency('TTD', { prefix: 'TT', items: [36] }),
        'TRY': formCurrency('TRY', [8378]),
        'TVD': formCurrency('TVD', [36]),
        'UAH': formCurrency('UAH', [8372]),
        'GBP': formCurrency('GBP', [163]),
        'USD': formCurrency('USD', [36]),
        'UYU': formCurrency('UYU', { isPost: true, items: [36, 85] }),
        'UZS': formCurrency('UZS', { isPost: true, items: [1083, 1074] }),
        'VEF': formCurrency('VEF', { isPost: true, items: [66, 115] }),
        'VND': formCurrency('VND', [8363]),
        'YER': formCurrency('YER', [65020]),
        'ZWD': formCurrency('ZWD', { prefix: 'Z', items: [36] }),
        // Additional items compiled manually
        'TND': formCurrency('TND', { isPost: true, items: [68, 84] })
    }

    return currencyIconCache = icons
}

export function getCurrencyIcon(currency) {
    currency = currency.toUpperCase()
    const icons = getCurrencies()
    const icon = icons[currency]
    if (icon) {
        return icon
    }

    return {
        code: currency,
        isPost: true,
        prefix: undefined,
        icon: ` ${currency}`,
        format: (value, fixed) => {
            let trimValue = value.toFixed(2)
            if (typeof fixed === 'number') {
                trimValue = value.toFixed(fixed)
            } else if (trimValue.toString() === '0.00') {
                trimValue = value.toFixed(Math.abs(value) >= 1.0 ? 2 : 8)
            }
            return `${trimValue} ${currency}`
        }
    }
}
