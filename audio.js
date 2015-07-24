var fs = require('fs')

var box = document.getElementById('box')
var box2 = document.getElementById('box2')
// Interesting parameters to tweak!
var SMOOTHING = 0.75
var FFT_SIZE = 2048

var H_SCALING_FACTOR = 1
var S_SCALING_FACTOR = 0.9
var L_SCALING_FACTOR = 1.5

var R_SCALING_FACTOR = 1
var G_SCALING_FACTOR = 1
var B_SCALING_FACTOR = 3.3

// Sub-bass 20-60 Hz
// Bass 60-250 Hz

// Low Midrange 250-500 Hz
// Midrange 500-2000 Hz

// Upper Midrange 2-4 kHz
// Presence and Brillance 4-20 kHz



var context = new AudioContext()
var audiobuf
var dataCollected

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length)
    var view = new Uint8Array(ab)
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i]
    }
    return ab
}

function getAverage(u8IntArray) {
  var total = 0
  var count = 0
  for (var i = 0; i < u8IntArray.length; ++i) {
    if (u8IntArray[i] !== 0) count++
    total += u8IntArray[i]
  }
  if (count === 0) return count
  else return total / count
}

function rgbToHex(R,G,B) {return toHex(R)+toHex(G)+toHex(B)}
function toHex(n) {
 n = parseInt(n,10);
 if (isNaN(n)) return "00";
 n = Math.max(0,Math.min(n,255));
 return "0123456789ABCDEF".charAt((n-n%16)/16)
      + "0123456789ABCDEF".charAt(n%16);
}

function syncStream(node){ // should be done by api itself. and hopefully will.
    var buf8 = new Uint8Array(node.buf);
    buf8.indexOf = Array.prototype.indexOf;
    var i=node.sync, b=buf8;
    while(1) {
        node.retry++;
        console.log(i)
        i=b.indexOf(0xFF,i); if(i==-1 || (b[i+1] & 0xE0 == 0xE0 )) break;
        i++;
    }
    if(i!=-1) {
        var tmp=node.buf.slice(i); //carefull there it returns copy
        delete(node.buf); node.buf=null;
        node.buf=tmp;
        node.sync=i;
        return true;
    }
    return false;
}

function play(time) {
  var source = context.createBufferSource()
  var analyser = context.createAnalyser()

  source.buffer = audiobuf
  analyser.connect(context.destination)

  source.connect(analyser)

  source.start(time)
  console.log('playing\nanalysis starting')

  gatherData(analyser)

}

function gatherData(analyser) {
  analyser.smoothingTimeConstant = SMOOTHING
  analyser.fftSize = FFT_SIZE
  // analyser.maxDecibels = 255
  var freqs = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(freqs)

  var first = freqs.subarray(1, 10)
  var second = freqs.subarray(10, 100)
  var third = freqs.subarray(100, freqs.length - 1)

  var R = parseInt(getAverage(first) * R_SCALING_FACTOR)
  var G = parseInt(getAverage(second) * G_SCALING_FACTOR)
  var B = parseInt(getAverage(third) * B_SCALING_FACTOR)

  var H = parseInt(getAverage(first) * H_SCALING_FACTOR)
  var S = parseInt(((getAverage(second) * 100) / 255) * S_SCALING_FACTOR)
  var L = parseInt(((getAverage(third) * 100) / 255) * L_SCALING_FACTOR)

  console.log('R ' + R + ' G ' + G + ' B ' + B)
  console.log('H ' + H + ' S ' + S + ' L ' + L)

  box.style.background = '#' + rgbToHex(R,G,B)
  box2.style.background = 'hsl(' + H + ',' + S + '%,' + L +'%)'

  setTimeout(function() {
    gatherData(analyser)
  }, 1000 / 100)
}

function decode(audio, cb) {
  context.decodeAudioData(audio,
  function (buf) {
    audiobuf = buf
    console.log('decodeAudioData complete')
    return cb()
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

loadFile('Youth.wav', function() {
  play(0)
})
