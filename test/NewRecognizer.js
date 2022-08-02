"use strict"

let baseRecognizer;
let transferRecognizer;
let serialized;

async function app() {
  baseRecognizer = speechCommands.create('BROWSER_FFT');
  await baseRecognizer.ensureModelLoaded();
  console.log(baseRecognizer.wordLabels());
  await buildModel();
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
      onEpochEnd: async (epoch, logs) => {
        console.log(`Epoch ${epoch}: loss=${logs.loss}, accuracy=${logs.acc}`);
      }
    }
  });
}
async function stopListen()
{
  if (transferRecognizer.isListening()) {
    transferRecognizer.stopListening();
    toggleButtons(true);
    document.getElementById('listen').textContent = 'Listen';
    return;
  }
}
async function listen()
{
  
  toggleButtons(false);
  document.getElementById('listen').textContent = 'Stop';
  document.getElementById('listen').disabled = false;

  await transferRecognizer.listen(result => {
    
    const words = transferRecognizer.wordLabels();
   
    const predLabelIndedx = tf.argMax(result.scores).dataSync()[0];
    document.getElementById('console').textContent = words[predLabelIndedx];
    stopListen();
  }, {probabilityThreshold: 0.75});
  
  // Stop the recognition in 10 seconds.
  setTimeout(() => {
  stopListen();
  document.getElementById('listen').textContent = 'Listen';
  }
  , 10e3
   );
 
  
}
async function serializeExamples()
{
  transferRecognizer.serializeExamples();
  //const saveResult = await transferRecognizer.save('localstorage://my-model-1');
}

async function loadExamples()
{
  const clearExisting = false;
  transferRecognizer.loadExamples(serialized, clearExisting);
}

function SaveModel()
{
  transferRecognizer.save();
}

function toggleButtons(enable) {
  document.querySelectorAll('button').forEach(b => b.disabled = !enable);
}
