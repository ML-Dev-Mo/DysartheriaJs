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


    const dbs = await window.indexedDB.databases()
    dbs.forEach(db => { window.indexedDB.deleteDatabase(db.name) })


    toggleButtons(false);

    document.getElementById('console').textContent = `Please wait`;

    baseRecognizer = speechCommands.create('BROWSER_FFT');
    await baseRecognizer.ensureModelLoaded();
    console.log(baseRecognizer.wordLabels());
    await buildModel();
    document.getElementById('console').textContent = `Model loaded`;

    toggleButtons(true);

    const dbss = await window.indexedDB.databases()
    dbss.forEach(db => { window.indexedDB.deleteDatabase(db.name) })
}

async function buildModel() {
    //check for the model in indexdb
    //if not present, create a new model
    //if present, load the model
    try {


        transferRecognizer = baseRecognizer.createTransfer('numbers');
        var result = await LoadModel();
        console.log(result);
    } catch (e) {
        console.log(e);
        //transferRecognizer = baseRecognizer.createTransfer('numbers');

    }

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
    document.getElementById('console').textContent = `Training started`;
    await transferRecognizer.train({
        epochs: 25,
        callback: {
            onEpochEnd: async(epoch, logs) => {
                console.log(`Epoch ${epoch}: loss=${logs.loss}, accuracy=${logs.acc}`);
            }
        }
    });

    await SaveModel();
    document.getElementById('console').textContent = `Training Ended!`;
    //await transferRecognizer.save('http://localhost/ehr.api/model');
    //await SaveModel();
    //await sendModel();
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
        sendDataToReact(words[predLabelIndedx]);
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
        try {
            const saveResult = await transferRecognizer.model.save('file:///f:/my-model');
        } catch {}
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


    // let openRequest = indexedDB.open(name, version);


    indexedDB.databases().then(list => {
        console.log("list : ", list);
    })


    // await app();
    var res = await transferRecognizer.load('indexeddb://crp');
    var clearExisting = false;
    transferRecognizer.loadExamples(serialized, clearExisting);
    return res;
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

async function sendModel() {
    await transferRecognizer.save("http://localhost/ehr.api/model/");
}

//load model from server
async function loadModelFromServer() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost/ehr.api/model', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('patient-email', $('#patient').va())
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

async function sendDataToReact(strData = "") {

    if (window.ReactNativeWebView)
        window.ReactNativeWebView.postMessage(strData);

}