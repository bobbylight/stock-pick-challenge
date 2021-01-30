const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
})

const percentageFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
})

export const currency = (value) => {
    return value != null ? formatter.format(value) : ''
}

export const percentage = (value) => {
    return value != null ? percentageFormatter.format(value) : ''
}
