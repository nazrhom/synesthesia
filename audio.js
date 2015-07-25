var fs = require('fs')

var box = document.getElementById('box')
var box2 = document.getElementById('box2')

var Normalizer = require('./normalizer.js')

var R_NORMALIZER = new Normalizer(25, 255, {stabilization_rate: 500})
var G_NORMALIZER = new Normalizer(25, 255, {stabilization_rate: 500})
var B_NORMALIZER = new Normalizer(25, 255, {stabilization_rate: 500})

var R1_NORMALIZER = new Normalizer(25, 255, {stabilization_rate: 50000, old: false})
var G1_NORMALIZER = new Normalizer(25, 255, {stabilization_rate: 50000, old: false})
var B1_NORMALIZER = new Normalizer(25, 255, {stabilization_rate: 50000, old: false})

// var H_NORMALIZER = new Normalizer(0, 360)
// var S_NORMALIZER = new Normalizer(10, 100)
// var L_NORMALIZER = new Normalizer(10, 100)

// Interesting parameters to tweak!
var SMOOTHING = 0.7
var FFT_SIZE = 2048

var SMOOTHING2 = 0.7
var FFT_SIZE2 = 2048

var H_SCALING_FACTOR = 1
var S_SCALING_FACTOR = 0.9
var L_SCALING_FACTOR = 1.5

var R_SCALING_FACTOR = 1
var G_SCALING_FACTOR = 1
var B_SCALING_FACTOR = 3.3

var context = new AudioContext()

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length)
    var view = new Uint8Array(ab)
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i]
    }
    return ab
}



function rgbToHex(R,G,B) {return toHex(R)+toHex(G)+toHex(B)}
function toHex(n) {
 n = parseInt(n,10);
 if (isNaN(n)) return "00";
 n = Math.max(0,Math.min(n,255));
 return "0123456789ABCDEF".charAt((n-n%16)/16)
      + "0123456789ABCDEF".charAt(n%16);
}

function getAverage(u8IntArray) {
  var total = 0
  for (var i = 0; i < u8IntArray.length; ++i) {
    total += u8IntArray[i]
  }
  var average = total / u8IntArray.length
  return average
}

function play(buffer, time) {
  var source = context.createBufferSource()
  var analyser = context.createAnalyser()
  var analyser2 = context.createAnalyser()

  source.buffer = buffer

  source.connect(analyser)
  analyser.connect(analyser2)
  analyser2.connect(context.destination)


  source.start(time)
  console.log('playing\nanalysis starting')

  gatherData(analyser, analyser2)

}

function gatherData(analyser, analyser2) {
  analyser.smoothingTimeConstant = SMOOTHING
  analyser.fftSize = FFT_SIZE

  analyser2.smoothingTimeConstant = SMOOTHING2
  analyser2.fftSize = FFT_SIZE2

  var freqs = new Uint8Array(analyser.frequencyBinCount)
  var freqs2 = new Uint8Array(analyser2.frequencyBinCount)

  analyser.getByteFrequencyData(freqs)
  analyser2.getByteFrequencyData(freqs2)


  // Every index accounts for sampleRate / (FFT_SIZE/2) Hz (44100 / 1024 ~= 43)these indexes correspond to
  // Sub-bass 20-60 Hz
  // Bass 60-250 Hz
  var first = freqs.subarray(1, 10)

  // Low Midrange 250-500 Hz
  // Midrange 500-2000 Hz
  var second = freqs.subarray(10, 100)
  // Upper Midrange 2-4 kHz
  // Presence and Brillance 4-20 kHz
  var third = freqs.subarray(100, freqs.length - 1)

  var first2 = freqs2.subarray(1, 10)

  var second2 = freqs2.subarray(10, 100)

  var third2 = freqs2.subarray(100, freqs.length - 1)


  var R = R_NORMALIZER.getNormalizedAverage(first)
  var G = G_NORMALIZER.getNormalizedAverage(second)
  var B = B_NORMALIZER.getNormalizedAverage(third)

  var R1 = R1_NORMALIZER.getNormalizedAverage(first2)
  var G1 = G1_NORMALIZER.getNormalizedAverage(second2)
  var B1 = B1_NORMALIZER.getNormalizedAverage(third2)

  console.log('R ' + R + ' G ' + G + ' B ' + B)
  // console.log('H ' + H + ' S ' + S + ' L ' + L)

  box.style.background = '#' + rgbToHex(R,G,B)
  box2.style.background = '#' + rgbToHex(R1,G1,B1)

  // box2.style.background = 'hsl(' + H + ',' + S + '%,' + L +'%)'

  // setTimeout(function() {
  //   gatherData(analyser)
  // }, 1000 / 100)
  window.requestAnimationFrame(function() {
    return gatherData(analyser, analyser2)
  })
}

function decode(audio, cb) {
  context.decodeAudioData(audio,
  function (buf) {
    console.log('decodeAudioData complete')
    return cb(buf)
  },
  function (err) {
    console.log('decodeAudioData error ' + err)
  })
}

function loadFile(filePath, cb) {
  fs.readFile(filePath, function (err, audio) {
    if (err) throw err
    decode(toArrayBuffer(audio), cb)
  })
}

loadFile('youth.wav', function(buffer) {
  play(buffer, 0)
})
