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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Utility functions for training and transfer learning of the speech-commands
 * model.
 */
var tf = require("@tensorflow/tfjs-core");
/**
 * Split feature and target tensors into train and validation (val) splits.
 *
 * Given sufficent number of examples, the train and val sets will be
 * balanced with respect to the classes.
 *
 * @param xs Features tensor, of shape [numExamples, ...].
 * @param ys Targets tensors, of shape [numExamples, numClasses]. Assumed to be
 *   one-hot categorical encoding.
 * @param valSplit A number > 0 and < 1, fraction of examples to use
 *   as the validation set.
 * @returns trainXs: training features tensor; trainYs: training targets
 *   tensor; valXs: validation features tensor; valYs: validation targets
 *   tensor.
 */
function balancedTrainValSplit(xs, ys, valSplit) {
    tf.util.assert(valSplit > 0 && valSplit < 1, function () { return "validationSplit is expected to be >0 and <1, " +
        ("but got " + valSplit); });
    return tf.tidy(function () {
        var classIndices = tf.argMax(ys, -1).dataSync();
        var indicesByClasses = [];
        for (var i = 0; i < classIndices.length; ++i) {
            var classIndex = classIndices[i];
            if (indicesByClasses[classIndex] == null) {
                indicesByClasses[classIndex] = [];
            }
            indicesByClasses[classIndex].push(i);
        }
        var numClasses = indicesByClasses.length;
        var trainIndices = [];
        var valIndices = [];
        // Randomly shuffle the list of indices in each array.
        indicesByClasses.map(function (classIndices) { return tf.util.shuffle(classIndices); });
        for (var i = 0; i < numClasses; ++i) {
            var classIndices_1 = indicesByClasses[i];
            var cutoff = Math.round(classIndices_1.length * (1 - valSplit));
            for (var j = 0; j < classIndices_1.length; ++j) {
                if (j < cutoff) {
                    trainIndices.push(classIndices_1[j]);
                }
                else {
                    valIndices.push(classIndices_1[j]);
                }
            }
        }
        var trainXs = tf.gather(xs, trainIndices);
        var trainYs = tf.gather(ys, trainIndices);
        var valXs = tf.gather(xs, valIndices);
        var valYs = tf.gather(ys, valIndices);
        return { trainXs: trainXs, trainYs: trainYs, valXs: valXs, valYs: valYs };
    });
}
exports.balancedTrainValSplit = balancedTrainValSplit;
/**
 * Same as balancedTrainValSplit, but for number arrays or Float32Arrays.
 */
function balancedTrainValSplitNumArrays(xs, ys, valSplit) {
    var e_1, _a, e_2, _b, e_3, _c, e_4, _d;
    tf.util.assert(valSplit > 0 && valSplit < 1, function () { return "validationSplit is expected to be >0 and <1, " +
        ("but got " + valSplit); });
    var isXsFloat32Array = !Array.isArray(xs[0]);
    var classIndices = ys;
    var indicesByClasses = [];
    for (var i = 0; i < classIndices.length; ++i) {
        var classIndex = classIndices[i];
        if (indicesByClasses[classIndex] == null) {
            indicesByClasses[classIndex] = [];
        }
        indicesByClasses[classIndex].push(i);
    }
    var numClasses = indicesByClasses.length;
    var trainIndices = [];
    var valIndices = [];
    // Randomly shuffle the list of indices in each array.
    indicesByClasses.map(function (classIndices) { return tf.util.shuffle(classIndices); });
    for (var i = 0; i < numClasses; ++i) {
        var classIndices_2 = indicesByClasses[i];
        var cutoff = Math.round(classIndices_2.length * (1 - valSplit));
        for (var j = 0; j < classIndices_2.length; ++j) {
            if (j < cutoff) {
                trainIndices.push(classIndices_2[j]);
            }
            else {
                valIndices.push(classIndices_2[j]);
            }
        }
    }
    if (isXsFloat32Array) {
        var trainXs = [];
        var trainYs = [];
        var valXs = [];
        var valYs = [];
        try {
            for (var trainIndices_1 = __values(trainIndices), trainIndices_1_1 = trainIndices_1.next(); !trainIndices_1_1.done; trainIndices_1_1 = trainIndices_1.next()) {
                var index = trainIndices_1_1.value;
                trainXs.push(xs[index]);
                trainYs.push(ys[index]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (trainIndices_1_1 && !trainIndices_1_1.done && (_a = trainIndices_1.return)) _a.call(trainIndices_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var valIndices_1 = __values(valIndices), valIndices_1_1 = valIndices_1.next(); !valIndices_1_1.done; valIndices_1_1 = valIndices_1.next()) {
                var index = valIndices_1_1.value;
                valXs.push(xs[index]);
                valYs.push(ys[index]);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (valIndices_1_1 && !valIndices_1_1.done && (_b = valIndices_1.return)) _b.call(valIndices_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return { trainXs: trainXs, trainYs: trainYs, valXs: valXs, valYs: valYs };
    }
    else {
        var trainXs = [];
        var trainYs = [];
        var valXs = [];
        var valYs = [];
        try {
            for (var trainIndices_2 = __values(trainIndices), trainIndices_2_1 = trainIndices_2.next(); !trainIndices_2_1.done; trainIndices_2_1 = trainIndices_2.next()) {
                var index = trainIndices_2_1.value;
                trainXs.push(xs[index]);
                trainYs.push(ys[index]);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (trainIndices_2_1 && !trainIndices_2_1.done && (_c = trainIndices_2.return)) _c.call(trainIndices_2);
            }
            finally { if (e_3) throw e_3.error; }
        }
        try {
            for (var valIndices_2 = __values(valIndices), valIndices_2_1 = valIndices_2.next(); !valIndices_2_1.done; valIndices_2_1 = valIndices_2.next()) {
                var index = valIndices_2_1.value;
                valXs.push(xs[index]);
                valYs.push(ys[index]);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (valIndices_2_1 && !valIndices_2_1.done && (_d = valIndices_2.return)) _d.call(valIndices_2);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return { trainXs: trainXs, trainYs: trainYs, valXs: valXs, valYs: valYs };
    }
}
exports.balancedTrainValSplitNumArrays = balancedTrainValSplitNumArrays;
//# sourceMappingURL=training_utils.js.map