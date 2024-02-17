import { formCurrency } from './currency.js'

let currencyIconCache = null

export function getCurrencies() {
    if (currencyIconCache) return currencyIconCache

    const icons = {
        // List compiled from external website
        // Source: https://www.xe.com/symbols/
        'ALL': formCurrency({ isPost: true, items: [76, 101, 107] }),
        'AFN': formCurrency({ isPost: true, items: [1547] }),
        'ARS': formCurrency([36]),
        'AWG': formCurrency({ isPost: true, items: [402] }),
        'AUD': formCurrency([36]),
        'AZN': formCurrency({ isPost: true, items: [8380] }),
        'BSD': formCurrency([36]),
        'BBD': formCurrency([36]),
        'BYN': formCurrency({ isPost: true, items: [66, 114] }),
        'BZD': formCurrency({ prefix: 'BZ', items: [36] }),
        'BMD': formCurrency([36]),
        'BOB': formCurrency({ isPost: true, items: [36, 98] }),
        'BAM': formCurrency({ isPost: true, items: [75, 77] }),
        'BWP': formCurrency({ isPost: true, items: [80] }),
        'BGN': formCurrency({ isPost: true, items: [1083, 1074] }),
        'BRL': formCurrency({ prefix: 'R', items: [36] }),
        'BND': formCurrency([36]),
        'KHR': formCurrency({ isPost: true, items: [6107] }),
        'CAD': formCurrency([36]),
        'KYD': formCurrency([36]),
        'CLP': formCurrency([36]),
        'CNY': formCurrency([165]),
        'COP': formCurrency([36]),
        'CRC': formCurrency([8353]),
        'HRK': formCurrency({ isPost: true, items: [107, 110] }),
        'CUP': formCurrency([8369]),
        'CZK': formCurrency({ isPost: true, items: [75, 269] }),
        'DKK': formCurrency({ isPost: true, items: [107, 114] }),
        'DOP': formCurrency({ prefix: 'RD', items: [36] }),
        'XCD': formCurrency([36]),
        'EGP': formCurrency([163]),
        'SVC': formCurrency([36]),
        'EUR': formCurrency([8364]),
        'FKP': formCurrency([163]),
        'FJD': formCurrency([36]),
        'GHS': formCurrency([162]),
        'GIP': formCurrency([163]),
        'GTQ': formCurrency({ isPost: true, items: [81] }),
        'GGP': formCurrency([163]),
        'GYD': formCurrency([36]),
        'HNL': formCurrency({ isPost: true, items: [76] }),
        'HKD': formCurrency([36]),
        'HUF': formCurrency({ isPost: true, items: [70, 116] }),
        'ISK': formCurrency({ isPost: true, items: [107, 114] }),
        'INR': formCurrency([8377]),
        'IDR': formCurrency({ isPost: true, items: [82, 112] }),
        'IRR': formCurrency([65020]),
        'IMP': formCurrency([163]),
        'ILS': formCurrency([8362]),
        'JMD': formCurrency([74, 36]),
        'JPY': formCurrency([165]),
        'JEP': formCurrency([163]),
        'KZT': formCurrency({ isPost: true, items: [1083, 1074] }),
        'KPW': formCurrency([8361]),
        'KRW': formCurrency([8361]),
        'KGS': formCurrency({ isPost: true, items: [1083, 1074] }),
        'LAK': formCurrency([8365]),
        'LBP': formCurrency([163]),
        'LRD': formCurrency([36]),
        'MKD': formCurrency({ isPost: true, items: [1076, 1077, 1085] }),
        'MYR': formCurrency({ isPost: true, items: [82, 77] }),
        'MUR': formCurrency([8360]),
        'MXN': formCurrency([36]),
        'MNT': formCurrency([8366]),
        'MZN': formCurrency({ isPost: true, items: [77, 84] }),
        'NAD': formCurrency([36]),
        'NPR': formCurrency([8360]),
        'ANG': formCurrency({ isPost: true, items: [402] }),
        'NZD': formCurrency([36]),
        'NIO': formCurrency({ prefix: 'C', items: [36] }),
        'NGN': formCurrency([8358]),
        'NOK': formCurrency({ isPost: true, items: [107, 114] }),
        'OMR': formCurrency([65020]),
        'PKR': formCurrency([8360]),
        'PAB': formCurrency([66, 47, 46]),
        'PYG': formCurrency({ isPost: true, items: [71, 115] }),
        'PEN': formCurrency([83, 47, 46]),
        'PHP': formCurrency([8369]),
        'PLN': formCurrency({ isPost: true, items: [122, 322] }),
        'QAR': formCurrency([65020]),
        'RON': formCurrency({ isPost: true, items: [108, 101, 105] }),
        'RUB': formCurrency([8381]),
        'SHP': formCurrency([163]),
        'SAR': formCurrency([65020]),
        'RSD': formCurrency({ isPost: true, items: [1044, 1080, 1085, 46] }),
        'SCR': formCurrency([8360]),
        'SGD': formCurrency([36]),
        'SBD': formCurrency([36]),
        'SOS': formCurrency({ isPost: true, items: [83] }),
        'ZAR': formCurrency({ isPost: true, items: [82] }),
        'LKR': formCurrency([8360]),
        'SEK': formCurrency({ isPost: true, items: [107, 114] }),
        'CHF': formCurrency({ isPost: true, items: [67, 72, 70] }),
        'SRD': formCurrency([36]),
        'SYP': formCurrency([163]),
        'TWD': formCurrency({ prefix: 'NT', items: [36] }),
        'THB': formCurrency([3647]),
        'TTD': formCurrency({ prefix: 'TT', items: [36] }),
        'TRY': formCurrency([8378]),
        'TVD': formCurrency([36]),
        'UAH': formCurrency([8372]),
        'GBP': formCurrency([163]),
        'USD': formCurrency([36]),
        'UYU': formCurrency({ isPost: true, items: [36, 85] }),
        'UZS': formCurrency({ isPost: true, items: [1083, 1074] }),
        'VEF': formCurrency({ isPost: true, items: [66, 115] }),
        'VND': formCurrency([8363]),
        'YER': formCurrency([65020]),
        'ZWD': formCurrency({ prefix: 'Z', items: [36] }),
        // Additional items compiled manually
        'TND': formCurrency({ isPost: true, items: [68, 84] })
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
        isPost: true,
        prefix: undefined,
        icon: ` ${currency}`,
        format: (value) => {
            return `${value} ${currency}`
        }
    }
}
