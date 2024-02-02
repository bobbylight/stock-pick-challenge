export const getPrimaryDeltaClass = value => {
  if (value < 0) {
    return 'primary-delta-loss'
  }
  if (value > 0) {
    return 'primary-delta-gain'
  }
  return 'primary-delta-none'
}

export const getSecondaryDeltaClass = value => {
  if (value < 0) {
    return 'secondary-delta-loss'
  }
  if (value > 0) {
    return 'secondary-delta-gain'
  }
  return 'secondary-delta-none'
}
