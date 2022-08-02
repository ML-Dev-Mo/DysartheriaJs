"use strict";

var NUM_FRAMES = 10;
var examples = [];
var recognizer;
var wordList = ["", "left", "right", "down", "up", "four", "five", "six", "seven", "eight", "nine", "yes", "no", "up", "down", "left", "right", "stop", "go"];

function showAllcommands() {
  document.querySelector('#commandsList').textContent = recognizer.wordLabels();
}

function collect(label) {
  if (recognizer.isListening()) {
    return recognizer.stopListening();
  }

  if (label == null) {
    return;
  }

  recognizer.listen(function _callee(_ref) {
    var _ref$spectrogram, frameSize, data, vals;

    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref$spectrogram = _ref.spectrogram, frameSize = _ref$spectrogram.frameSize, data = _ref$spectrogram.data;
            vals = normalize(data.subarray(-frameSize * NUM_FRAMES));
            examples.push({
              vals: vals,
              label: label
            });
            document.querySelector('#console').textContent = "".concat(examples.length, " examples collected, Label: ").concat(label);

          case 4:
          case "end":
            return _context.stop();
        }
      }
    });
  }, {
    overlapFactor: 0.999,
    includeSpectrogram: true,
    invokeCallbackOnNoiseAndUnknown: true
  });
}

function normalize(x) {
  var mean = -100;
  var std = 10;
  return x.map(function (x) {
    return (x - mean) / std;
  });
}

function app() {
  return regeneratorRuntime.async(function app$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          recognizer = speechCommands.create('BROWSER_FFT');
          _context2.next = 3;
          return regeneratorRuntime.awrap(recognizer.ensureModelLoaded());

        case 3:
          //predictWord() no longer called.
          buildModel();

        case 4:
        case "end":
          return _context2.stop();
      }
    }
  });
}

var INPUT_SHAPE = [NUM_FRAMES, 232, 1];
var model;

function train() {
  var ys, xsShape, xs;
  return regeneratorRuntime.async(function train$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          toggleButtons(false);
          ys = tf.oneHot(examples.map(function (e) {
            return e.label;
          }), 3);
          xsShape = [examples.length].concat(INPUT_SHAPE);
          xs = tf.tensor(flatten(examples.map(function (e) {
            return e.vals;
          })), xsShape);
          _context3.next = 6;
          return regeneratorRuntime.awrap(model.fit(xs, ys, {
            batchSize: 16,
            epochs: 10,
            callbacks: {
              onEpochEnd: function onEpochEnd(epoch, logs) {
                document.querySelector('#console').textContent = "Accuracy: ".concat((logs.acc * 100).toFixed(1), "% Epoch: ").concat(epoch + 1);
              }
            }
          }));

        case 6:
          tf.dispose([xs, ys]);
          toggleButtons(true);

        case 8:
        case "end":
          return _context3.stop();
      }
    }
  });
}

function buildModel() {
  model = tf.sequential();
  model.add(tf.layers.depthwiseConv2d({
    depthMultiplier: 8,
    kernelSize: [NUM_FRAMES, 3],
    activation: 'relu',
    inputShape: INPUT_SHAPE
  }));
  model.add(tf.layers.maxPooling2d({
    poolSize: [1, 2],
    strides: [2, 2]
  }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({
    units: 3,
    activation: 'softmax'
  }));
  var optimizer = tf.train.adam(0.01);
  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
}

function toggleButtons(enable) {
  document.querySelectorAll('button').forEach(function (b) {
    return b.disabled = !enable;
  });
}

function flatten(tensors) {
  var size = tensors[0].length;
  var result = new Float32Array(tensors.length * size);
  tensors.forEach(function (arr, i) {
    return result.set(arr, i * size);
  });
  return result;
}

function listen() {
  if (recognizer.isListening()) {
    recognizer.stopListening();
    toggleButtons(true);
    document.getElementById('listen').textContent = 'Listen';
    return;
  }

  toggleButtons(false);
  document.getElementById('listen').textContent = 'Stop';
  document.getElementById('listen').disabled = false;
  recognizer.listen(function (_ref2) {
    var _ref2$spectrogram = _ref2.spectrogram,
        frameSize = _ref2$spectrogram.frameSize,
        data = _ref2$spectrogram.data;
    var vals = normalize(data.subarray(-frameSize * NUM_FRAMES));
    var input = tf.tensor(vals, [1].concat(INPUT_SHAPE));
    var probs = model.predict(input);
    var predLabel = probs.argMax(1);
    var label = predLabel.dataSync()[0];
    document.getElementById('console').textContent = wordList[label];
    tf.dispose([input, probs, predLabel]);
  }, {
    overlapFactor: 0.999,
    includeSpectrogram: true,
    invokeCallbackOnNoiseAndUnknown: true
  });
}