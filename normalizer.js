
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
}

Normalizer.prototype.average = function (u8IntArray) {
  var total = 0
  for (var i = 0; i < u8IntArray.length; ++i) {
    total += u8IntArray[i]
  }
  var average = total / u8IntArray.length
  //check invariants
  // var local_max = this.observedMax
  // var local_min = this.observedMin
  this.update(average)
  // if (local_max > this.observedMax) throw Error('invariant failed')
  // if (local_min < this.observedMin) throw Error('invariant failed')

  return average
}

Normalizer.prototype.normalize = function (val) {
  if (this.verbose) console.log('value', val)
  if (this.verbose) console.log('observedMax', this.observedMax);
  if (this.verbose) console.log('observedMin', this.observedMin);
  if (this.verbose) console.log('partial', ( (val - this.observedMin) ))
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
