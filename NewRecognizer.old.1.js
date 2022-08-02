"use strict"
let baseRecognizer;
let transferRecognizer;
let serialized;
let recognizer;

async function uploadAndRecognizeAudio() {
    var file = document.getElementById("file").files[0];
    var reader = new FileReader();
    var data;
    reader.readAsArrayBuffer(file);
    reader.onload = async function(event) {
        var buffer = event.target.result;
        data = {
            buffer: buffer
        };
        var result = await recognizeFromAudioStream(buffer);
    }
};

async function recognizeFromAudioStream(arrayBuffer) {

    ///////////////////////


    // var spectro = Spectrogram(document.getElementById('canvas'), {
    //     audio: {
    //         enable: false
    //     }
    // });

    await app();
    var res = await transferRecognizer.load('indexeddb://crp');
    var clearExisting = false;
    transferRecognizer.loadExamples(serialized, clearExisting);


    var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    var audio = audioCtx.createBufferSource();
    var audioBlob = new Blob([arrayBuffer], {
        type: 'audio/wav'
    });
    var floatArray = new Float32Array(arrayBuffer)
    floatArray = floatArray.slice(0, 9976);
    var tensor4k = tf.reshape(floatArray, [1, 43, 232, 1]);
    const recognizer = speechCommands.create('BROWSER_FFT');
    await transferRecognizer.ensureModelLoaded();
    const result = await transferRecognizer.recognize(floatArray);
    console.log(result);

    const words = recognizer.wordLabels();
    const predLabelIndedx = tf.argMax(result.scores).dataSync()[0];
    console.log(words[predLabelIndedx]);
    document.getElementById('console').textContent = words[predLabelIndedx];
    // var test = await recognizer.serializedExamples2ArrayBuffer(audiofile);
    // const result = await recognizer.recognize(audiofile);
    // console.log(result);
    // return result;
}

async function app() {
    baseRecognizer = speechCommands.create('BROWSER_FFT');
    await baseRecognizer.ensureModelLoaded();
    console.log(baseRecognizer.wordLabels());
    await buildModel();
    //add example to the model
    // await transferRecognizer.collectExample("food");
    // await transferRecognizer.collectExample("water");
    // await transferRecognizer.collectExample("WC");
    // await transferRecognizer.collectExample("call");
    // await transferRecognizer.collectExample("text");
    // await transferRecognizer.collectExample("help");
    // await transferRecognizer.collectExample("emergency");
    // await transferRecognizer.collectExample("_background_noise_");

    console.log(baseRecognizer.wordLabels());

}

async function buildModel() {
    transferRecognizer = baseRecognizer.createTransfer('numbers');
    //await transferRecognizer.save('indexeddb://model');
}

async function collect(label) {
    if (transferRecognizer.isListening()) {
        return transferRecognizer.stopListening();
    }
    if (label == null) {
        return;
    }
    await transferRecognizer.collectExample(label);
    document.querySelector('#console').textContent =
        `$examples collected, Label: ${JSON.stringify(await transferRecognizer.countExamples())}`;
}

async function train() {

    await transferRecognizer.train({
        epochs: 25,
        callback: {
            onEpochEnd: async(epoch, logs) => {
                console.log(`Epoch ${epoch}: loss=${logs.loss}, accuracy=${logs.acc}`);

                step += 20;

                if (step <= 100) {
                    var element = document.getElementById('progressbar');
                    element.style.width = `${step}%`;

                    if (step == 100) {
                        $('#train').attr('disabled', 'disabled');
                        document.getElementById('train').innerHTML = '<i class="h2 fas fa-check mb-0"></i>';
                        completeTraining();
                        //TODO: Save model
                        SaveModel();
                    }
                }

            }
        }
    });
}


async function stopListen() {
    if (transferRecognizer.isListening()) {
        transferRecognizer.stopListening();
        toggleButtons(true);
        document.getElementById('listen').textContent = 'Listen';
        return;
    }
}


async function listen() {
    document.querySelector('#console').textContent = "";
    toggleButtons(false);
    document.getElementById('listen').textContent = 'Stop';
    document.getElementById('listen').disabled = false;
    await transferRecognizer.listen(result => {
        const words = transferRecognizer.wordLabels();
        const predLabelIndedx = tf.argMax(result.scores).dataSync()[0];
        document.getElementById('console').textContent = words[predLabelIndedx];
        stopListen();
    }, { probabilityThreshold: 0.75 });

    // Stop the recognition in 10 seconds.
    setTimeout(() => {
        stopListen();
        document.getElementById('listen').textContent = 'Listen';
        document.querySelector('#console').textContent = "";
    }, 10e3);
}

async function serializeExamples() {
    serialized = transferRecognizer.serializeExamples();
    debugger;
    if (transferRecognizer.model.save != undefined) {
        const saveResult = await transferRecognizer.model.save('file:///f:/my-model');
    }
}

async function loadExamples() {
    const clearExisting = false;
    transferRecognizer.loadExamples(serialized, clearExisting);
}

async function SaveModel() {
    serialized = transferRecognizer.serializeExamples();

    var result = await transferRecognizer.save('indexeddb://crp');
}

async function LoadModel() {
    // transferRecognizer.load('indexeddb://crp');
    await app();
    var res = await transferRecognizer.load('indexeddb://crp');
    var clearExisting = false;
    transferRecognizer.loadExamples(serialized, clearExisting);
    console.log(res);
    //var model = await tf.loadLayersModel('indexeddb://crp');
    //await transferRecognizer.load(model); 
    // await transferRecognizer.ensureModelLoaded()
}

function toggleButtons(enable) {
    document.querySelectorAll('button').forEach(b => b.disabled = !enable);
}

async function ordinaryApp() {
    recognizer = speechCommands.create('BROWSER_FFT');
    // Make sure that the underlying model and metadata are loaded via HTTPS
    // requests.
    document.getElementById('listenOrdinary').disabled = true;
    await recognizer.ensureModelLoaded();
    // See the array of words that the recognizer is trained to recognize.
    console.log(recognizer.wordLabels());
}

function ordinaryListen() {
    document.querySelector('#console').textContent = "";
    document.getElementById('listenOrdinary').disabled = true;
    recognizer.listen(result => {
        console.log(result.scores);
        document.getElementById('listenOrdinary').disabled = true;
        var recognized_word_index = tf.argMax(result.scores);
        var word = recognizer.wordLabels()[recognized_word_index.dataSync()[0]];
        document.querySelector('#console').textContent = word;
        if (recognizer.isListening())
            recognizer.stopListening();
        document.getElementById('listenOrdinary').disabled = false;
        // - result.scores contains the probability scores that correspond to
        //   recognizer.wordLabels().
        // - result.spectrogram contains the spectrogram of the recognized word.
    }, {
        includeSpectrogram: true,
        probabilityThreshold: 0.98,
        //invokeCallbackOnNoiseAndUnknown: true
    });

    // Stop the recognition in 10 seconds.
    setTimeout(() => {
            if (recognizer.isListening())
                recognizer.stopListening();
            document.getElementById('listenOrdinary').disabled = false;
        },
        10e3);
}
var ordinary_area = document.getElementById("ordinaryArea");
var learning_area = document.getElementById("learningArea");
var patient;

var step = 0;

function ordinaryEvent() {

    document.getElementById('listenOrdinary').disabled = true;
    (async() => await ordinaryApp().then(
        document.getElementById('listenOrdinary').disabled = false
    ))();
}

function learningEvent() {

    (async() => await app().then(
        // alert('ready')
    ))();
}

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

function renderModel(message) {
    console.log(message.data);
}

function completeTraining() {

    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('completed');
    }

}

//send model to api on the server
async function sendModel() {
    var model = await transferRecognizer.model.save('file:///f:/my-model');
    var model_json = model.json();
    //send model_json to server
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost/ehr.api/model', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(model_json));
    xhr.onload = function() {
        if (this.status == 200) {
            console.log(this.responseText);
        }
    }
}

//load model from server
async function loadModelFromServer() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost/ehr.api/model', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
    xhr.onload = async function() {
        if (this.status == 200) {
            var model_json = JSON.parse(this.responseText);
            var model = await tf.loadLayersModel('file:///f:/my-model');
            await transferRecognizer.load(model);
            console.log(model_json);
        }
    }
}