const utils = {

  getPrimaryDeltaClass: value => {
    if (value < 0) {
      return 'primary-delta-loss'
    }
    if (value > 0) {
      return 'primary-delta-gain'
    }
    return 'primary-delta-none'
  },

  getSecondaryDeltaClass: value => {
    if (value < 0) {
      return 'secondary-delta-loss'
    }
    if (value > 0) {
      return 'secondary-delta-gain'
    }
    return 'secondary-delta-none'
  },
}

export default utils
