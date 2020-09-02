/**
 * Copyright Schrodinger, LLC
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableHelper
 * @typechecks
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Locale = _interopRequireDefault(require('./Locale'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var DIR_SIGN = _Locale["default"].isRTL() ? -1 : +1;
var FixedDataTableHelper = {
  DIR_SIGN: DIR_SIGN
};
var _default = FixedDataTableHelper;
exports["default"] = _default;