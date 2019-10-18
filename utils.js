"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = __importDefault(require("colors")); // eslint-disable-line
colors_1.default.black;
exports.log = {
    info: (msg, ...args) => console.log('GSD7_alpha:'.blue, 'info'.cyan, msg, ...args),
    warn: (msg, ...args) => console.log('GSD7_alpha:'.blue, 'warning'.yellow, msg, ...args),
    error: (msg, ...args) => console.error('GSD7_alpha:'.blue, 'error'.red, msg, ...args),
    success: (msg, ...args) => console.log('GSD7_alpha:'.blue, 'success'.green, msg, ...args),
};
