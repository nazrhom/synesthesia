
function Normalizer (min, max, opts) {
  opts = opts || {}
  this.verbose = opts.verbose
  this.old = opts.old
  this.stabilization_rate = opts.stabilization_rate
  this.min = min
  this.max = max
  this.observedMin = parseInt(max / 2) - 1
  this.observedMax = parseInt(max / 2)
  this.minCount = 0
  this.maxCount = 0
  this.cycles = 0
  // this is u8IntArray.length (1024)
  this.freqfreq = opts.freqfreq
  this.freqMask = new Uint8Array(1024)
}

Normalizer.prototype.average = function (u8IntArray) {
  var total = 0
  var count = 0
  for (var i = 0; i < u8IntArray.length; ++i) {
    if (u8IntArray[i] != 0) this.freqMask[i]++
    if ((this.freqMask[i] / this.cycles) > this.freqfreq) {
      count++
      total += u8IntArray[i]
    }
  }
  // if count is 0 just bail without incrementing cycles or attempting to update
  if (count === 0) return count

  var average = total / count

  this.update(average)

  if(this.verbose) console.log('freqMask', this.freqMask);
  if(this.verbose) console.log('cycles', this.cycles);
  this.cycles++
  return average
}

Normalizer.prototype.normalize = function (val) {
  // if (this.verbose) console.log('value', val)
  // if (this.verbose) console.log('observedMax', this.observedMax);
  // if (this.verbose) console.log('observedMin', this.observedMin);
  // if (this.verbose) console.log('partial', ( (val - this.observedMin) ))
  return ( ( (val - this.observedMin) * (this.max - this.min) ) / (this.observedMax - this.observedMin) ) + this.min
}

Normalizer.prototype.update = function (val) {
  if (val === 0) return
  if (this.old) {
    if (this.observedMax < val) {
      this.observedMax = ((this.observedMax * this.maxCount) + val) / ++this.maxCount
    }
    if (this.observedMin > val) {
      this.observedMin = ((this.observedMin * this.minCount) + val) / ++this.minCount
    }
  } else {
    if (this.observedMax < val) {
      this.observedMax = val
    }
    else if (this.observedMin > val) {
      this.observedMin = val
    }
    else if (val > ((this.observedMax - this.observedMin) / 2)) {
      if (this.verbose) console.log('increasing', this.observedMin - val)
      this.observedMin = this.observedMin + (Math.pow(val - this.observedMin, 1 / this.stabilization_rate))
    }
    else if (val < ((this.observedMax - this.observedMin) / 2)) {
      if (this.verbose) console.log('decreasing', val - this.observedMax)
      this.observedMax = this.observedMax - (Math.pow(this.observedMax - val, 1 / this.stabilization_rate))
    }
  }
  return
}

Normalizer.prototype.getNormalizedAverage = function (u8IntArray) {
  var result = parseInt(this.normalize(this.average(u8IntArray)))
  // if (result > this.max || result < this.min) {
  //   console.log('this', this)
  //   console.log('result', result)
  //   throw new Error('postcondition failed')
  // }
  if (this.verbose) console.log(result)
  return result
};

module.exports = Normalizer
