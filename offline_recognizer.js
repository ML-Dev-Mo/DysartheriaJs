function sendFileToOfflineReognizer()
{
    var trainFilesSelector = document.getElementById('trainFilesSelector');
    var spectrogram = "";
    offline_recognizer(spectrogram)
}
async function offline_recognizer(mySpectrogramData) {
    const recognizer = speechCommands.create('BROWSER_FFT');

    // Inspect the input shape of the recognizer's underlying tf.Model.
    console.log(recognizer.modelInputShape());
    // You will get something like [null, 43, 232, 1].
    // - The first dimension (null) is an undetermined batch dimension.
    // - The second dimension (e.g., 43) is the number of audio frames.
    // - The third dimension (e.g., 232) is the number of frequency data points in
    //   every frame (i.e., column) of the spectrogram
    // - The last dimension (e.g., 1) is fixed at 1. This follows the convention of
    //   convolutional neural networks in TensorFlow.js and Keras.

    // Inspect the sampling frequency and FFT size:
    console.log(recognizer.params().sampleRateHz);
    console.log(recognizer.params().fftSize);


    const x = tf.tensor4d(
        mySpectrogramData, [1].concat(recognizer.modelInputShape().slice(1)));
    var output = await recognizer.recognize(x);
    // output has the same format as `result` in the online streaming example
    // above: the `scores` field contains the probabilities of the words.

    tf.dispose([x, output]);
    return output;
}