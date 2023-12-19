const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
})

const percentageFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
})

export const currency = (value) => {
    return value != null ? currencyFormatter.format(value) : ''
}

export const percentage = (value) => {
    if (value == null) {
        return ''
    }
    value = parseFloat(value)
    const arrow = value > 0 ? '\u2191' : (value < 0 ? '\u2193' : '')
    return percentageFormatter.format(value) + arrow
}

export const installGlobalFilters = (app) => {
    app.config.globalProperties.$filters = {
        currency,
        percentage,
    }
}
