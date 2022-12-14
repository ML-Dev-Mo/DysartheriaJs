"use strict";
/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var tf = require("@tensorflow/tfjs-core");
var tfd = require("@tensorflow/tfjs-data");
var browser_fft_utils_1 = require("./browser_fft_utils");
var generic_utils_1 = require("./generic_utils");
var training_utils_1 = require("./training_utils");
// Descriptor for serialized dataset files: stands for:
//   TensorFlow.js Speech-Commands Dataset.
// DO NOT EVER CHANGE THIS!
exports.DATASET_SERIALIZATION_DESCRIPTOR = 'TFJSSCDS';
// A version number for the serialization. Since this needs
// to be encoded within a length-1 Uint8 array, it must be
//   1. an positive integer.
//   2. monotonically increasing over its change history.
// Item 1 is checked by unit tests.
exports.DATASET_SERIALIZATION_VERSION = 1;
exports.BACKGROUND_NOISE_TAG = '_background_noise_';
/**
 * A serializable, mutable set of speech/audio `Example`s;
 */
var Dataset = /** @class */ (function () {
    /**
     * Constructor of `Dataset`.
     *
     * If called with no arguments (i.e., `artifacts` == null), an empty dataset
     * will be constructed.
     *
     * Else, the dataset will be deserialized from `artifacts`.
     *
     * @param serialized Optional serialization artifacts to deserialize.
     */
    function Dataset(serialized) {
        this.examples = {};
        this.label2Ids = {};
        if (serialized != null) {
            // Deserialize from the provided artifacts.
            var artifacts = arrayBuffer2SerializedExamples(serialized);
            var offset = 0;
            for (var i = 0; i < artifacts.manifest.length; ++i) {
                var spec = artifacts.manifest[i];
                var byteLen = spec.spectrogramNumFrames * spec.spectrogramFrameSize;
                if (spec.rawAudioNumSamples != null) {
                    byteLen += spec.rawAudioNumSamples;
                }
                byteLen *= 4;
                this.addExample(deserializeExample({ spec: spec, data: artifacts.data.slice(offset, offset + byteLen) }));
                offset += byteLen;
            }
        }
    }
    /**
     * Add an `Example` to the `Dataset`
     *
     * @param example A `Example`, with a label. The label must be a non-empty
     *   string.
     * @returns The UID for the added `Example`.
     */
    Dataset.prototype.addExample = function (example) {
        tf.util.assert(example != null, function () { return 'Got null or undefined example'; });
        tf.util.assert(example.label != null && example.label.length > 0, function () { return "Expected label to be a non-empty string, " +
            ("but got " + JSON.stringify(example.label)); });
        var uid = generic_utils_1.getUID();
        this.examples[uid] = example;
        if (!(example.label in this.label2Ids)) {
            this.label2Ids[example.label] = [];
        }
        this.label2Ids[example.label].push(uid);
        return uid;
    };
    /**
     * Merge the incoming dataset into this dataset
     *
     * @param dataset The incoming dataset to be merged into this dataset.
     */
    Dataset.prototype.merge = function (dataset) {
        var e_1, _a, e_2, _b;
        tf.util.assert(dataset !== this, function () { return 'Cannot merge a dataset into itself'; });
        var vocab = dataset.getVocabulary();
        try {
            for (var vocab_1 = __values(vocab), vocab_1_1 = vocab_1.next(); !vocab_1_1.done; vocab_1_1 = vocab_1.next()) {
                var word = vocab_1_1.value;
                var examples = dataset.getExamples(word);
                try {
                    for (var examples_1 = (e_2 = void 0, __values(examples)), examples_1_1 = examples_1.next(); !examples_1_1.done; examples_1_1 = examples_1.next()) {
                        var example = examples_1_1.value;
                        this.addExample(example.example);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (examples_1_1 && !examples_1_1.done && (_b = examples_1.return)) _b.call(examples_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (vocab_1_1 && !vocab_1_1.done && (_a = vocab_1.return)) _a.call(vocab_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /**
     * Get a map from `Example` label to number of `Example`s with the label.
     *
     * @returns A map from label to number of example counts under that label.
     */
    Dataset.prototype.getExampleCounts = function () {
        var counts = {};
        for (var uid in this.examples) {
            var example = this.examples[uid];
            if (!(example.label in counts)) {
                counts[example.label] = 0;
            }
            counts[example.label]++;
        }
        return counts;
    };
    /**
     * Get all examples of a given label, with their UIDs.
     *
     * @param label The requested label.
     * @return All examples of the given `label`, along with their UIDs.
     *   The examples are sorted in the order in which they are added to the
     *   `Dataset`.
     * @throws Error if label is `null` or `undefined`.
     */
    Dataset.prototype.getExamples = function (label) {
        var _this = this;
        tf.util.assert(label != null, function () {
            return "Expected label to be a string, but got " + JSON.stringify(label);
        });
        tf.util.assert(label in this.label2Ids, function () { return "No example of label \"" + label + "\" exists in dataset"; });
        var output = [];
        this.label2Ids[label].forEach(function (id) {
            output.push({ uid: id, example: _this.examples[id] });
        });
        return output;
    };
    /**
     * Get all examples and labels as tensors.
     *
     * - If `label` is provided and exists in the vocabulary of the `Dataset`,
     *   the spectrograms of all `Example`s under the `label` will be returned
     *   as a 4D `tf.Tensor` as `xs`. The shape of the `tf.Tensor` will be
     *     `[numExamples, numFrames, frameSize, 1]`
     *   where
     *     - `numExamples` is the number of `Example`s with the label
     *     - `numFrames` is the number of frames in each spectrogram
     *     - `frameSize` is the size of each spectrogram frame.
     *   No label Tensor will be returned.
     * - If `label` is not provided, all `Example`s will be returned as `xs`.
     *   In addition, `ys` will contain a one-hot encoded list of labels.
     *   - The shape of `xs` will be: `[numExamples, numFrames, frameSize, 1]`
     *   - The shape of `ys` will be: `[numExamples, vocabularySize]`.
     *
     * @returns If `config.getDataset` is `true`, returns two `tf.data.Dataset`
     *   objects, one for training and one for validation.
     *   Else, xs` and `ys` tensors. See description above.
     * @throws Error
     *   - if not all the involved spectrograms have matching `numFrames` and
     *     `frameSize`, or
     *   - if `label` is provided and is not present in the vocabulary of the
     *     `Dataset`, or
     *   - if the `Dataset` is currently empty.
     */
    Dataset.prototype.getData = function (label, config) {
        var _this = this;
        tf.util.assert(this.size() > 0, function () {
            return "Cannot get spectrograms as tensors because the dataset is empty";
        });
        var vocab = this.getVocabulary();
        if (label != null) {
            tf.util.assert(vocab.indexOf(label) !== -1, function () { return "Label " + label + " is not in the vocabulary " +
                ("(" + JSON.stringify(vocab) + ")"); });
        }
        else {
            // If all words are requested, there must be at least two words in the
            // vocabulary to make one-hot encoding possible.
            tf.util.assert(vocab.length > 1, function () { return "One-hot encoding of labels requires the vocabulary to have " +
                ("at least two words, but it has only " + vocab.length + " word."); });
        }
        if (config == null) {
            config = {};
        }
        // Get the numFrames lengths of all the examples currently held by the
        // dataset.
        var sortedUniqueNumFrames = this.getSortedUniqueNumFrames();
        var numFrames;
        var hopFrames;
        if (sortedUniqueNumFrames.length === 1) {
            numFrames = config.numFrames == null ? sortedUniqueNumFrames[0] :
                config.numFrames;
            hopFrames = config.hopFrames == null ? 1 : config.hopFrames;
        }
        else {
            numFrames = config.numFrames;
            tf.util.assert(numFrames != null && Number.isInteger(numFrames) && numFrames > 0, function () { return "There are " + sortedUniqueNumFrames.length + " unique lengths among " +
                ("the " + _this.size() + " examples of this Dataset, hence numFrames ") +
                "is required. But it is not provided."; });
            tf.util.assert(numFrames <= sortedUniqueNumFrames[0], function () { return "numFrames (" + numFrames + ") exceeds the minimum numFrames " +
                ("(" + sortedUniqueNumFrames[0] + ") among the examples of ") +
                "the Dataset."; });
            hopFrames = config.hopFrames;
            tf.util.assert(hopFrames != null && Number.isInteger(hopFrames) && hopFrames > 0, function () { return "There are " + sortedUniqueNumFrames.length + " unique lengths among " +
                ("the " + _this.size() + " examples of this Dataset, hence hopFrames ") +
                "is required. But it is not provided."; });
        }
        // Normalization is performed by default.
        var toNormalize = config.normalize == null ? true : config.normalize;
        return tf.tidy(function () {
            var e_3, _a;
            var xTensors = [];
            var xArrays = [];
            var labelIndices = [];
            var uniqueFrameSize;
            for (var i = 0; i < vocab.length; ++i) {
                var currentLabel = vocab[i];
                if (label != null && currentLabel !== label) {
                    continue;
                }
                var ids = _this.label2Ids[currentLabel];
                var _loop_1 = function (id) {
                    var e_4, _a;
                    var example = _this.examples[id];
                    var spectrogram = example.spectrogram;
                    var frameSize = spectrogram.frameSize;
                    if (uniqueFrameSize == null) {
                        uniqueFrameSize = frameSize;
                    }
                    else {
                        tf.util.assert(frameSize === uniqueFrameSize, function () { return "Mismatch in frameSize  " +
                            ("(" + frameSize + " vs " + uniqueFrameSize + ")"); });
                    }
                    var snippetLength = spectrogram.data.length / frameSize;
                    var focusIndex = null;
                    if (currentLabel !== exports.BACKGROUND_NOISE_TAG) {
                        focusIndex = spectrogram.keyFrameIndex == null ?
                            getMaxIntensityFrameIndex(spectrogram).dataSync()[0] :
                            spectrogram.keyFrameIndex;
                    }
                    // TODO(cais): See if we can get rid of dataSync();
                    var snippet = tf.tensor3d(spectrogram.data, [snippetLength, frameSize, 1]);
                    var windows = getValidWindows(snippetLength, focusIndex, numFrames, hopFrames);
                    var _loop_2 = function (window_1) {
                        var windowedSnippet = tf.tidy(function () {
                            var output = tf.slice(snippet, [window_1[0], 0, 0], [window_1[1] - window_1[0], -1, -1]);
                            return toNormalize ? browser_fft_utils_1.normalize(output) : output;
                        });
                        if (config.getDataset) {
                            // TODO(cais): See if we can do away with dataSync();
                            // TODO(cais): Shuffling?
                            xArrays.push(windowedSnippet.dataSync());
                        }
                        else {
                            xTensors.push(windowedSnippet);
                        }
                        if (label == null) {
                            labelIndices.push(i);
                        }
                    };
                    try {
                        for (var windows_1 = (e_4 = void 0, __values(windows)), windows_1_1 = windows_1.next(); !windows_1_1.done; windows_1_1 = windows_1.next()) {
                            var window_1 = windows_1_1.value;
                            _loop_2(window_1);
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (windows_1_1 && !windows_1_1.done && (_a = windows_1.return)) _a.call(windows_1);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                    tf.dispose(snippet); // For memory saving.
                };
                try {
                    for (var ids_1 = (e_3 = void 0, __values(ids)), ids_1_1 = ids_1.next(); !ids_1_1.done; ids_1_1 = ids_1.next()) {
                        var id = ids_1_1.value;
                        _loop_1(id);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (ids_1_1 && !ids_1_1.done && (_a = ids_1.return)) _a.call(ids_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            if (config.augmentByMixingNoiseRatio != null) {
                _this.augmentByMixingNoise(config.getDataset ? xArrays :
                    xTensors, labelIndices, config.augmentByMixingNoiseRatio);
            }
            var shuffle = config.shuffle == null ? true : config.shuffle;
            if (config.getDataset) {
                var batchSize = config.datasetBatchSize == null ? 32 : config.datasetBatchSize;
                // Split the data into two splits: training and validation.
                var valSplit_1 = config.datasetValidationSplit == null ?
                    0.15 :
                    config.datasetValidationSplit;
                tf.util.assert(valSplit_1 > 0 && valSplit_1 < 1, function () { return "Invalid dataset validation split: " + valSplit_1; });
                var zippedXandYArrays = xArrays.map(function (xArray, i) { return [xArray, labelIndices[i]]; });
                tf.util.shuffle(zippedXandYArrays); // Shuffle the data before splitting.
                xArrays = zippedXandYArrays.map(function (item) { return item[0]; });
                var yArrays = zippedXandYArrays.map(function (item) { return item[1]; });
                var _b = training_utils_1.balancedTrainValSplitNumArrays(xArrays, yArrays, valSplit_1), trainXs = _b.trainXs, trainYs = _b.trainYs, valXs = _b.valXs, valYs = _b.valYs;
                // TODO(cais): The typing around Float32Array is not working properly
                // for tf.data currently. Tighten the types when the tf.data bug is
                // fixed.
                // tslint:disable:no-any
                var xTrain = tfd.array(trainXs).map(function (x) { return tf.tensor3d(x, [
                    numFrames, uniqueFrameSize, 1
                ]); });
                var yTrain = tfd.array(trainYs).map(function (y) { return tf.squeeze(tf.oneHot([y], vocab.length), [0]); });
                // TODO(cais): See if we can tighten the typing.
                var trainDataset = tfd.zip({ xs: xTrain, ys: yTrain });
                if (shuffle) {
                    // Shuffle the dataset.
                    trainDataset = trainDataset.shuffle(xArrays.length);
                }
                trainDataset = trainDataset.batch(batchSize).prefetch(4);
                var xVal = tfd.array(valXs).map(function (x) { return tf.tensor3d(x, [
                    numFrames, uniqueFrameSize, 1
                ]); });
                var yVal = tfd.array(valYs).map(function (y) { return tf.squeeze(tf.oneHot([y], vocab.length), [0]); });
                var valDataset = tfd.zip({ xs: xVal, ys: yVal });
                valDataset = valDataset.batch(batchSize).prefetch(4);
                // tslint:enable:no-any
                // tslint:disable-next-line:no-any
                return [trainDataset, valDataset];
            }
            else {
                if (shuffle) {
                    // Shuffle the data.
                    var zipped_1 = [];
                    xTensors.forEach(function (xTensor, i) {
                        zipped_1.push({ x: xTensor, y: labelIndices[i] });
                    });
                    tf.util.shuffle(zipped_1);
                    xTensors = zipped_1.map(function (item) { return item.x; });
                    labelIndices = zipped_1.map(function (item) { return item.y; });
                }
                var targets = label == null ?
                    tf.cast(tf.oneHot(tf.tensor1d(labelIndices, 'int32'), vocab.length), 'float32') :
                    undefined;
                return {
                    xs: tf.stack(xTensors),
                    ys: targets
                };
            }
        });
    };
    Dataset.prototype.augmentByMixingNoise = function (xs, labelIndices, ratio) {
        var e_5, _a;
        if (xs == null || xs.length === 0) {
            throw new Error("Cannot perform augmentation because data is null or empty");
        }
        var isTypedArray = xs[0] instanceof Float32Array;
        var vocab = this.getVocabulary();
        var noiseExampleIndices = [];
        var wordExampleIndices = [];
        for (var i = 0; i < labelIndices.length; ++i) {
            if (vocab[labelIndices[i]] === exports.BACKGROUND_NOISE_TAG) {
                noiseExampleIndices.push(i);
            }
            else {
                wordExampleIndices.push(i);
            }
        }
        if (noiseExampleIndices.length === 0) {
            throw new Error("Cannot perform augmentation by mixing with noise when " +
                ("there is no example with label " + exports.BACKGROUND_NOISE_TAG));
        }
        var mixedXTensors = [];
        var mixedLabelIndices = [];
        var _loop_3 = function (index) {
            var noiseIndex = // Randomly sample from the noises, with replacement.
             noiseExampleIndices[generic_utils_1.getRandomInteger(0, noiseExampleIndices.length)];
            var signalTensor = isTypedArray ?
                tf.tensor1d(xs[index]) :
                xs[index];
            var noiseTensor = isTypedArray ?
                tf.tensor1d(xs[noiseIndex]) :
                xs[noiseIndex];
            var mixed = tf.tidy(function () { return browser_fft_utils_1.normalize(tf.add(signalTensor, tf.mul(noiseTensor, ratio))); });
            if (isTypedArray) {
                mixedXTensors.push(mixed.dataSync());
            }
            else {
                mixedXTensors.push(mixed);
            }
            mixedLabelIndices.push(labelIndices[index]);
        };
        try {
            for (var wordExampleIndices_1 = __values(wordExampleIndices), wordExampleIndices_1_1 = wordExampleIndices_1.next(); !wordExampleIndices_1_1.done; wordExampleIndices_1_1 = wordExampleIndices_1.next()) {
                var index = wordExampleIndices_1_1.value;
                _loop_3(index);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (wordExampleIndices_1_1 && !wordExampleIndices_1_1.done && (_a = wordExampleIndices_1.return)) _a.call(wordExampleIndices_1);
            }
            finally { if (e_5) throw e_5.error; }
        }
        console.log("Data augmentation: mixing noise: added " + mixedXTensors.length + " " +
            "examples");
        mixedXTensors.forEach(function (tensor) { return xs.push(tensor); });
        labelIndices.push.apply(labelIndices, __spread(mixedLabelIndices));
    };
    Dataset.prototype.getSortedUniqueNumFrames = function () {
        var e_6, _a;
        var numFramesSet = new Set();
        var vocab = this.getVocabulary();
        for (var i = 0; i < vocab.length; ++i) {
            var label = vocab[i];
            var ids = this.label2Ids[label];
            try {
                for (var ids_2 = (e_6 = void 0, __values(ids)), ids_2_1 = ids_2.next(); !ids_2_1.done; ids_2_1 = ids_2.next()) {
                    var id = ids_2_1.value;
                    var spectrogram = this.examples[id].spectrogram;
                    var numFrames = spectrogram.data.length / spectrogram.frameSize;
                    numFramesSet.add(numFrames);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (ids_2_1 && !ids_2_1.done && (_a = ids_2.return)) _a.call(ids_2);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
        var uniqueNumFrames = __spread(numFramesSet);
        uniqueNumFrames.sort();
        return uniqueNumFrames;
    };
    /**
     * Remove an example from the `Dataset`.
     *
     * @param uid The UID of the example to remove.
     * @throws Error if the UID doesn't exist in the `Dataset`.
     */
    Dataset.prototype.removeExample = function (uid) {
        if (!(uid in this.examples)) {
            throw new Error("Nonexistent example UID: " + uid);
        }
        var label = this.examples[uid].label;
        delete this.examples[uid];
        var index = this.label2Ids[label].indexOf(uid);
        this.label2Ids[label].splice(index, 1);
        if (this.label2Ids[label].length === 0) {
            delete this.label2Ids[label];
        }
    };
    /**
     * Set the key frame index of a given example.
     *
     * @param uid The UID of the example of which the `keyFrameIndex` is to be
     *   set.
     * @param keyFrameIndex The desired value of the `keyFrameIndex`. Must
     *   be >= 0, < the number of frames of the example, and an integer.
     * @throws Error If the UID and/or the `keyFrameIndex` value is invalid.
     */
    Dataset.prototype.setExampleKeyFrameIndex = function (uid, keyFrameIndex) {
        if (!(uid in this.examples)) {
            throw new Error("Nonexistent example UID: " + uid);
        }
        var spectrogram = this.examples[uid].spectrogram;
        var numFrames = spectrogram.data.length / spectrogram.frameSize;
        tf.util.assert(keyFrameIndex >= 0 && keyFrameIndex < numFrames &&
            Number.isInteger(keyFrameIndex), function () { return "Invalid keyFrameIndex: " + keyFrameIndex + ". " +
            ("Must be >= 0, < " + numFrames + ", and an integer."); });
        spectrogram.keyFrameIndex = keyFrameIndex;
    };
    /**
     * Get the total number of `Example` currently held by the `Dataset`.
     *
     * @returns Total `Example` count.
     */
    Dataset.prototype.size = function () {
        return Object.keys(this.examples).length;
    };
    /**
     * Get the total duration of the `Example` currently held by `Dataset`,
     *
     * in milliseconds.
     *
     * @return Total duration in milliseconds.
     */
    Dataset.prototype.durationMillis = function () {
        var durMillis = 0;
        var DEFAULT_FRAME_DUR_MILLIS = 23.22;
        for (var key in this.examples) {
            var spectrogram = this.examples[key].spectrogram;
            var frameDurMillis = spectrogram.frameDurationMillis | DEFAULT_FRAME_DUR_MILLIS;
            durMillis +=
                spectrogram.data.length / spectrogram.frameSize * frameDurMillis;
        }
        return durMillis;
    };
    /**
     * Query whether the `Dataset` is currently empty.
     *
     * I.e., holds zero examples.
     *
     * @returns Whether the `Dataset` is currently empty.
     */
    Dataset.prototype.empty = function () {
        return this.size() === 0;
    };
    /**
     * Remove all `Example`s from the `Dataset`.
     */
    Dataset.prototype.clear = function () {
        this.examples = {};
    };
    /**
     * Get the list of labels among all `Example`s the `Dataset` currently holds.
     *
     * @returns A sorted Array of labels, for the unique labels that belong to all
     *   `Example`s currently held by the `Dataset`.
     */
    Dataset.prototype.getVocabulary = function () {
        var vocab = new Set();
        for (var uid in this.examples) {
            var example = this.examples[uid];
            vocab.add(example.label);
        }
        var sortedVocab = __spread(vocab);
        sortedVocab.sort();
        return sortedVocab;
    };
    /**
     * Serialize the `Dataset`.
     *
     * The `Examples` are sorted in the following order:
     *   - First, the labels in the vocabulary are sorted.
     *   - Second, the `Example`s for every label are sorted by the order in
     *     which they are added to this `Dataset`.
     *
     * @param wordLabels Optional word label(s) to serialize. If specified, only
     *   the examples with labels matching the argument will be serialized. If
     *   any specified word label does not exist in the vocabulary of this
     *   dataset, an Error will be thrown.
     * @returns A `ArrayBuffer` object amenable to transmission and storage.
     */
    Dataset.prototype.serialize = function (wordLabels) {
        var e_7, _a, e_8, _b;
        var vocab = this.getVocabulary();
        tf.util.assert(!this.empty(), function () { return "Cannot serialize empty Dataset"; });
        if (wordLabels != null) {
            if (!Array.isArray(wordLabels)) {
                wordLabels = [wordLabels];
            }
            wordLabels.forEach(function (wordLabel) {
                if (vocab.indexOf(wordLabel) === -1) {
                    throw new Error("Word label \"" + wordLabel + "\" does not exist in the " +
                        "vocabulary of this dataset. The vocabulary is: " +
                        (JSON.stringify(vocab) + "."));
                }
            });
        }
        var manifest = [];
        var buffers = [];
        try {
            for (var vocab_2 = __values(vocab), vocab_2_1 = vocab_2.next(); !vocab_2_1.done; vocab_2_1 = vocab_2.next()) {
                var label = vocab_2_1.value;
                if (wordLabels != null && wordLabels.indexOf(label) === -1) {
                    continue;
                }
                var ids = this.label2Ids[label];
                try {
                    for (var ids_3 = (e_8 = void 0, __values(ids)), ids_3_1 = ids_3.next(); !ids_3_1.done; ids_3_1 = ids_3.next()) {
                        var id = ids_3_1.value;
                        var artifact = serializeExample(this.examples[id]);
                        manifest.push(artifact.spec);
                        buffers.push(artifact.data);
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (ids_3_1 && !ids_3_1.done && (_b = ids_3.return)) _b.call(ids_3);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (vocab_2_1 && !vocab_2_1.done && (_a = vocab_2.return)) _a.call(vocab_2);
            }
            finally { if (e_7) throw e_7.error; }
        }
        return serializedExamples2ArrayBuffer({ manifest: manifest, data: generic_utils_1.concatenateArrayBuffers(buffers) });
    };
    return Dataset;
}());
exports.Dataset = Dataset;
/** Serialize an `Example`. */
function serializeExample(example) {
    var hasRawAudio = example.rawAudio != null;
    var spec = {
        label: example.label,
        spectrogramNumFrames: example.spectrogram.data.length / example.spectrogram.frameSize,
        spectrogramFrameSize: example.spectrogram.frameSize,
    };
    if (example.spectrogram.keyFrameIndex != null) {
        spec.spectrogramKeyFrameIndex = example.spectrogram.keyFrameIndex;
    }
    var data = example.spectrogram.data.buffer.slice(0);
    if (hasRawAudio) {
        spec.rawAudioNumSamples = example.rawAudio.data.length;
        spec.rawAudioSampleRateHz = example.rawAudio.sampleRateHz;
        // Account for the fact that the data are all float32.
        data = generic_utils_1.concatenateArrayBuffers([data, example.rawAudio.data.buffer]);
    }
    return { spec: spec, data: data };
}
exports.serializeExample = serializeExample;
/** Deserialize an `Example`. */
function deserializeExample(artifact) {
    var spectrogram = {
        frameSize: artifact.spec.spectrogramFrameSize,
        data: new Float32Array(artifact.data.slice(0, 4 * artifact.spec.spectrogramFrameSize *
            artifact.spec.spectrogramNumFrames))
    };
    if (artifact.spec.spectrogramKeyFrameIndex != null) {
        spectrogram.keyFrameIndex = artifact.spec.spectrogramKeyFrameIndex;
    }
    var ex = { label: artifact.spec.label, spectrogram: spectrogram };
    if (artifact.spec.rawAudioNumSamples != null) {
        ex.rawAudio = {
            sampleRateHz: artifact.spec.rawAudioSampleRateHz,
            data: new Float32Array(artifact.data.slice(4 * artifact.spec.spectrogramFrameSize *
                artifact.spec.spectrogramNumFrames))
        };
    }
    return ex;
}
exports.deserializeExample = deserializeExample;
/**
 * Encode intermediate serialization format as an ArrayBuffer.
 *
 * Format of the binary ArrayBuffer:
 *   1. An 8-byte descriptor (see above).
 *   2. A 4-byte version number as Uint32.
 *   3. A 4-byte number for the byte length of the JSON manifest.
 *   4. The encoded JSON manifest
 *   5. The binary data of the spectrograms, and raw audio (if any).
 *
 * @param serialized: Intermediate serialization format of a dataset.
 * @returns The binary conversion result as an ArrayBuffer.
 */
function serializedExamples2ArrayBuffer(serialized) {
    var manifestBuffer = generic_utils_1.string2ArrayBuffer(JSON.stringify(serialized.manifest));
    var descriptorBuffer = generic_utils_1.string2ArrayBuffer(exports.DATASET_SERIALIZATION_DESCRIPTOR);
    var version = new Uint32Array([exports.DATASET_SERIALIZATION_VERSION]);
    var manifestLength = new Uint32Array([manifestBuffer.byteLength]);
    var headerBuffer = generic_utils_1.concatenateArrayBuffers([descriptorBuffer, version.buffer, manifestLength.buffer]);
    return generic_utils_1.concatenateArrayBuffers([headerBuffer, manifestBuffer, serialized.data]);
}
/** Decode an ArrayBuffer as intermediate serialization format. */
function arrayBuffer2SerializedExamples(buffer) {
    tf.util.assert(buffer != null, function () { return 'Received null or undefined buffer'; });
    // Check descriptor.
    var offset = 0;
    var descriptor = generic_utils_1.arrayBuffer2String(buffer.slice(offset, exports.DATASET_SERIALIZATION_DESCRIPTOR.length));
    tf.util.assert(descriptor === exports.DATASET_SERIALIZATION_DESCRIPTOR, function () { return "Deserialization error: Invalid descriptor"; });
    offset += exports.DATASET_SERIALIZATION_DESCRIPTOR.length;
    // Skip the version part for now. It may be used in the future.
    offset += 4;
    // Extract the length of the encoded manifest JSON as a Uint32.
    var manifestLength = new Uint32Array(buffer, offset, 1);
    offset += 4;
    var manifestBeginByte = offset;
    offset = manifestBeginByte + manifestLength[0];
    var manifestBytes = buffer.slice(manifestBeginByte, offset);
    var manifestString = generic_utils_1.arrayBuffer2String(manifestBytes);
    var manifest = JSON.parse(manifestString);
    var data = buffer.slice(offset);
    return { manifest: manifest, data: data };
}
exports.arrayBuffer2SerializedExamples = arrayBuffer2SerializedExamples;
/**
 * Get valid windows in a long snippet.
 *
 * Each window is represented by an inclusive left index and an exclusive
 * right index.
 *
 * @param snippetLength Long of the entire snippet. Must be a positive
 *   integer.
 * @param focusIndex Optional. If `null` or `undefined`, an array of
 *   evenly-spaced windows will be generated. The array of windows will
 *   start from the first possible location (i.e., [0, windowLength]).
 *   If not `null` or `undefined`, must be an integer >= 0 and < snippetLength.
 * @param windowLength Length of each window. Must be a positive integer and
 *   <= snippetLength.
 * @param windowHop Hops between successsive windows. Must be a positive
 *   integer.
 * @returns An array of [beginIndex, endIndex] pairs.
 */
function getValidWindows(snippetLength, focusIndex, windowLength, windowHop) {
    tf.util.assert(Number.isInteger(snippetLength) && snippetLength > 0, function () {
        return "snippetLength must be a positive integer, but got " + snippetLength;
    });
    if (focusIndex != null) {
        tf.util.assert(Number.isInteger(focusIndex) && focusIndex >= 0, function () {
            return "focusIndex must be a non-negative integer, but got " + focusIndex;
        });
    }
    tf.util.assert(Number.isInteger(windowLength) && windowLength > 0, function () { return "windowLength must be a positive integer, but got " + windowLength; });
    tf.util.assert(Number.isInteger(windowHop) && windowHop > 0, function () { return "windowHop must be a positive integer, but got " + windowHop; });
    tf.util.assert(windowLength <= snippetLength, function () { return "windowLength (" + windowLength + ") exceeds snippetLength " +
        ("(" + snippetLength + ")"); });
    tf.util.assert(focusIndex < snippetLength, function () { return "focusIndex (" + focusIndex + ") equals or exceeds snippetLength " +
        ("(" + snippetLength + ")"); });
    if (windowLength === snippetLength) {
        return [[0, snippetLength]];
    }
    var windows = [];
    if (focusIndex == null) {
        // Deal with the special case of no focus frame:
        // Output an array of evenly-spaced windows, starting from
        // the first possible location.
        var begin = 0;
        while (begin + windowLength <= snippetLength) {
            windows.push([begin, begin + windowLength]);
            begin += windowHop;
        }
        return windows;
    }
    var leftHalf = Math.floor(windowLength / 2);
    var left = focusIndex - leftHalf;
    if (left < 0) {
        left = 0;
    }
    else if (left + windowLength > snippetLength) {
        left = snippetLength - windowLength;
    }
    while (true) {
        if (left - windowHop < 0 || focusIndex >= left - windowHop + windowLength) {
            break;
        }
        left -= windowHop;
    }
    while (left + windowLength <= snippetLength) {
        if (focusIndex < left) {
            break;
        }
        windows.push([left, left + windowLength]);
        left += windowHop;
    }
    return windows;
}
exports.getValidWindows = getValidWindows;
/**
 * Calculate an intensity profile from a spectrogram.
 *
 * The intensity at each time frame is caclulated by simply averaging all the
 * spectral values that belong to that time frame.
 *
 * @param spectrogram The input spectrogram.
 * @returns The temporal profile of the intensity as a 1D tf.Tensor of shape
 *   `[numFrames]`.
 */
function spectrogram2IntensityCurve(spectrogram) {
    return tf.tidy(function () {
        var numFrames = spectrogram.data.length / spectrogram.frameSize;
        var x = tf.tensor2d(spectrogram.data, [numFrames, spectrogram.frameSize]);
        return tf.mean(x, -1);
    });
}
exports.spectrogram2IntensityCurve = spectrogram2IntensityCurve;
/**
 * Get the index to the maximum intensity frame.
 *
 * The intensity of each time frame is calculated as the arithmetic mean of
 * all the spectral values belonging to that time frame.
 *
 * @param spectrogram The input spectrogram.
 * @returns The index to the time frame containing the maximum intensity.
 */
function getMaxIntensityFrameIndex(spectrogram) {
    return tf.tidy(function () { return tf.argMax(spectrogram2IntensityCurve(spectrogram)); });
}
exports.getMaxIntensityFrameIndex = getMaxIntensityFrameIndex;
//# sourceMappingURL=dataset.js.map