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
Object.defineProperty(exports, "__esModule", { value: true });
var test_util_1 = require("@tensorflow/tfjs-core/dist/test_util");
var generic_utils_1 = require("./generic_utils");
describe('string2ArrayBuffer and arrayBuffer2String', function () {
    it('round trip: ASCII only', function () {
        var str = 'Lorem_Ipsum_123 !@#$%^&*()';
        expect(generic_utils_1.arrayBuffer2String(generic_utils_1.string2ArrayBuffer(str))).toEqual(str);
    });
    it('round trip: non-ASCII', function () {
        var str = 'Welcome 欢迎 स्वागत हे ようこそ добро пожаловать 😀😀';
        expect(generic_utils_1.arrayBuffer2String(generic_utils_1.string2ArrayBuffer(str))).toEqual(str);
    });
    it('round trip: empty string', function () {
        var str = '';
        expect(generic_utils_1.arrayBuffer2String(generic_utils_1.string2ArrayBuffer(str))).toEqual(str);
    });
});
describe('concatenateFloat32Arrays', function () {
    it('Two non-empty', function () {
        var xs = new Float32Array([1, 3]);
        var ys = new Float32Array([3, 7]);
        test_util_1.expectArraysEqual(generic_utils_1.concatenateFloat32Arrays([xs, ys]), new Float32Array([1, 3, 3, 7]));
        test_util_1.expectArraysEqual(generic_utils_1.concatenateFloat32Arrays([ys, xs]), new Float32Array([3, 7, 1, 3]));
        // Assert that the original Float32Arrays are not altered.
        test_util_1.expectArraysEqual(xs, new Float32Array([1, 3]));
        test_util_1.expectArraysEqual(ys, new Float32Array([3, 7]));
    });
    it('Three unequal lengths non-empty', function () {
        var array1 = new Float32Array([1]);
        var array2 = new Float32Array([2, 3]);
        var array3 = new Float32Array([4, 5, 6]);
        test_util_1.expectArraysEqual(generic_utils_1.concatenateFloat32Arrays([array1, array2, array3]), new Float32Array([1, 2, 3, 4, 5, 6]));
    });
    it('One empty, one non-empty', function () {
        var xs = new Float32Array([4, 2]);
        var ys = new Float32Array(0);
        test_util_1.expectArraysEqual(generic_utils_1.concatenateFloat32Arrays([xs, ys]), new Float32Array([4, 2]));
        test_util_1.expectArraysEqual(generic_utils_1.concatenateFloat32Arrays([ys, xs]), new Float32Array([4, 2]));
        // Assert that the original Float32Arrays are not altered.
        test_util_1.expectArraysEqual(xs, new Float32Array([4, 2]));
        test_util_1.expectArraysEqual(ys, new Float32Array(0));
    });
    it('Two empty', function () {
        var xs = new Float32Array(0);
        var ys = new Float32Array(0);
        test_util_1.expectArraysEqual(generic_utils_1.concatenateFloat32Arrays([xs, ys]), new Float32Array(0));
        test_util_1.expectArraysEqual(generic_utils_1.concatenateFloat32Arrays([ys, xs]), new Float32Array(0));
        // Assert that the original Float32Arrays are not altered.
        test_util_1.expectArraysEqual(xs, new Float32Array(0));
        test_util_1.expectArraysEqual(ys, new Float32Array(0));
    });
});
//# sourceMappingURL=generic_utils_test.js.map