"use strict";

function sendFileToOfflineReognizer() {
  var trainFilesSelector = document.getElementById('trainFilesSelector');
  var spectrogram = "";
  offline_recognizer(spectrogram);
}

function offline_recognizer(mySpectrogramData) {
  var recognizer, x, output;
  return regeneratorRuntime.async(function offline_recognizer$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          recognizer = speechCommands.create('BROWSER_FFT'); // Inspect the input shape of the recognizer's underlying tf.Model.

          console.log(recognizer.modelInputShape()); // You will get something like [null, 43, 232, 1].
          // - The first dimension (null) is an undetermined batch dimension.
          // - The second dimension (e.g., 43) is the number of audio frames.
          // - The third dimension (e.g., 232) is the number of frequency data points in
          //   every frame (i.e., column) of the spectrogram
          // - The last dimension (e.g., 1) is fixed at 1. This follows the convention of
          //   convolutional neural networks in TensorFlow.js and Keras.
          // Inspect the sampling frequency and FFT size:

          console.log(recognizer.params().sampleRateHz);
          console.log(recognizer.params().fftSize);
          x = tf.tensor4d(mySpectrogramData, [1].concat(recognizer.modelInputShape().slice(1)));
          _context.next = 7;
          return regeneratorRuntime.awrap(recognizer.recognize(x));

        case 7:
          output = _context.sent;
          // output has the same format as `result` in the online streaming example
          // above: the `scores` field contains the probabilities of the words.
          tf.dispose([x, output]);
          return _context.abrupt("return", output);

        case 10:
        case "end":
          return _context.stop();
      }
    }
  });
}