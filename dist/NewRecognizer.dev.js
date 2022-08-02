"use strict";

var baseRecognizer;
var transferRecognizer;
var serialized;
var recognizer;

function app() {
  return regeneratorRuntime.async(function app$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          baseRecognizer = speechCommands.create('BROWSER_FFT');
          _context.next = 3;
          return regeneratorRuntime.awrap(baseRecognizer.ensureModelLoaded());

        case 3:
          console.log(baseRecognizer.wordLabels());
          _context.next = 6;
          return regeneratorRuntime.awrap(buildModel());

        case 6:
        case "end":
          return _context.stop();
      }
    }
  });
}

function buildModel() {
  return regeneratorRuntime.async(function buildModel$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          transferRecognizer = baseRecognizer.createTransfer('numbers'); //await transferRecognizer.save('indexeddb://model');

        case 1:
        case "end":
          return _context2.stop();
      }
    }
  });
}

function collect(label) {
  return regeneratorRuntime.async(function collect$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (!transferRecognizer.isListening()) {
            _context3.next = 2;
            break;
          }

          return _context3.abrupt("return", transferRecognizer.stopListening());

        case 2:
          if (!(label == null)) {
            _context3.next = 4;
            break;
          }

          return _context3.abrupt("return");

        case 4:
          _context3.next = 6;
          return regeneratorRuntime.awrap(transferRecognizer.collectExample(label));

        case 6:
          _context3.t0 = "$examples collected, Label: ";
          _context3.t1 = JSON;
          _context3.next = 10;
          return regeneratorRuntime.awrap(transferRecognizer.countExamples());

        case 10:
          _context3.t2 = _context3.sent;
          _context3.t3 = _context3.t1.stringify.call(_context3.t1, _context3.t2);
          document.querySelector('#console').textContent = _context3.t0.concat.call(_context3.t0, _context3.t3);

        case 13:
        case "end":
          return _context3.stop();
      }
    }
  });
}

function train() {
  return regeneratorRuntime.async(function train$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return regeneratorRuntime.awrap(transferRecognizer.train({
            epochs: 25,
            callback: {
              onEpochEnd: function onEpochEnd(epoch, logs) {
                return regeneratorRuntime.async(function onEpochEnd$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        console.log("Epoch ".concat(epoch, ": loss=").concat(logs.loss, ", accuracy=").concat(logs.acc));

                      case 1:
                      case "end":
                        return _context4.stop();
                    }
                  }
                });
              }
            }
          }));

        case 2:
        case "end":
          return _context5.stop();
      }
    }
  });
}

function stopListen() {
  return regeneratorRuntime.async(function stopListen$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          if (!transferRecognizer.isListening()) {
            _context6.next = 5;
            break;
          }

          transferRecognizer.stopListening();
          toggleButtons(true);
          document.getElementById('listen').textContent = 'Listen';
          return _context6.abrupt("return");

        case 5:
        case "end":
          return _context6.stop();
      }
    }
  });
}

function listen() {
  return regeneratorRuntime.async(function listen$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          document.querySelector('#console').textContent = "";
          toggleButtons(false);
          document.getElementById('listen').textContent = 'Stop';
          document.getElementById('listen').disabled = false;
          _context7.next = 6;
          return regeneratorRuntime.awrap(transferRecognizer.listen(function (result) {
            var words = transferRecognizer.wordLabels();
            var predLabelIndedx = tf.argMax(result.scores).dataSync()[0];
            document.getElementById('console').textContent = words[predLabelIndedx];
            stopListen();
          }, {
            probabilityThreshold: 0.75
          }));

        case 6:
          // Stop the recognition in 10 seconds.
          setTimeout(function () {
            stopListen();
            document.getElementById('listen').textContent = 'Listen';
            document.querySelector('#console').textContent = "";
          }, 10e3);

        case 7:
        case "end":
          return _context7.stop();
      }
    }
  });
}

function serializeExamples() {
  var saveResult;
  return regeneratorRuntime.async(function serializeExamples$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          serialized = transferRecognizer.serializeExamples();
          debugger;

          if (!(transferRecognizer.model.save != undefined)) {
            _context8.next = 6;
            break;
          }

          _context8.next = 5;
          return regeneratorRuntime.awrap(transferRecognizer.model.save('file:///f:/my-model'));

        case 5:
          saveResult = _context8.sent;

        case 6:
        case "end":
          return _context8.stop();
      }
    }
  });
}

function loadExamples() {
  var clearExisting;
  return regeneratorRuntime.async(function loadExamples$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          clearExisting = false;
          transferRecognizer.loadExamples(serialized, clearExisting);

        case 2:
        case "end":
          return _context9.stop();
      }
    }
  });
}

function SaveModel() {
  var result;
  return regeneratorRuntime.async(function SaveModel$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          serialized = transferRecognizer.serializeExamples();
          _context10.next = 3;
          return regeneratorRuntime.awrap(transferRecognizer.save('indexeddb://crp'));

        case 3:
          result = _context10.sent;

        case 4:
        case "end":
          return _context10.stop();
      }
    }
  });
}

function LoadModel() {
  var res, clearExisting;
  return regeneratorRuntime.async(function LoadModel$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.next = 2;
          return regeneratorRuntime.awrap(app());

        case 2:
          _context11.next = 4;
          return regeneratorRuntime.awrap(transferRecognizer.load('indexeddb://crp'));

        case 4:
          res = _context11.sent;
          clearExisting = false;
          transferRecognizer.loadExamples(serialized, clearExisting);
          console.log(res); //var model = await tf.loadLayersModel('indexeddb://crp');
          //await transferRecognizer.load(model); 
          // await transferRecognizer.ensureModelLoaded()

        case 8:
        case "end":
          return _context11.stop();
      }
    }
  });
}

function toggleButtons(enable) {
  document.querySelectorAll('button').forEach(function (b) {
    return b.disabled = !enable;
  });
}

function ordinaryApp() {
  return regeneratorRuntime.async(function ordinaryApp$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          recognizer = speechCommands.create('BROWSER_FFT'); // Make sure that the underlying model and metadata are loaded via HTTPS
          // requests.

          document.getElementById('listenOrdinary').disabled = true;
          _context12.next = 4;
          return regeneratorRuntime.awrap(recognizer.ensureModelLoaded());

        case 4:
          // See the array of words that the recognizer is trained to recognize.
          console.log(recognizer.wordLabels());

        case 5:
        case "end":
          return _context12.stop();
      }
    }
  });
}

function ordinaryListen() {
  document.querySelector('#console').textContent = "";
  document.getElementById('listenOrdinary').disabled = true;
  recognizer.listen(function (result) {
    console.log(result.scores);
    document.getElementById('listenOrdinary').disabled = true;
    var recognized_word_index = tf.argMax(result.scores);
    var word = recognizer.wordLabels()[recognized_word_index.dataSync()[0]];
    document.querySelector('#console').textContent = word;
    if (recognizer.isListening()) recognizer.stopListening();
    document.getElementById('listenOrdinary').disabled = false; // - result.scores contains the probability scores that correspond to
    //   recognizer.wordLabels().
    // - result.spectrogram contains the spectrogram of the recognized word.
  }, {
    includeSpectrogram: true,
    probabilityThreshold: 0.98 //invokeCallbackOnNoiseAndUnknown: true

  }); // Stop the recognition in 10 seconds.

  setTimeout(function () {
    if (recognizer.isListening()) recognizer.stopListening();
    document.getElementById('listenOrdinary').disabled = false;
  }, 10e3);
}