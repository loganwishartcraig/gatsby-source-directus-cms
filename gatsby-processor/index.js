"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gatsby_node_helpers_1 = __importDefault(require("gatsby-node-helpers"));
const gatsby_type_1 = require("./gatsby-type");
class GatsbyProcessor {
    constructor(config, gatsby) {
        this._typePrefix = 'Directus';
        this._includeJunctions = false;
        this._downloadFiles = true;
        if (typeof config.typePrefix === 'string') {
            this._typePrefix = config.typePrefix;
        }
        if (typeof config.includeJunctions === 'boolean') {
            this._includeJunctions = config.includeJunctions;
        }
        if (typeof config.downloadFiles === 'boolean') {
            this._downloadFiles = config.downloadFiles;
        }
        const { createNodeFactory, generateNodeId } = gatsby_node_helpers_1.default({
            typePrefix: this._typePrefix
        });
        this.createNodeFactory = createNodeFactory;
        this.generateNodeId = generateNodeId;
        this.gatsby = gatsby;
    }
    processMesh(mesh) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield Promise.all(mesh.getCollections()
                .filter(({ isJunction }) => !isJunction || this._includeJunctions)
                .map(collection => new gatsby_type_1.GatsbyType(collection, this).buildNodes()));
            return Promise.all(nodes.flat().map(node => (this.gatsby.actions.createNode(node))));
        });
    }
    get downloadFiles() {
        return this._downloadFiles;
    }
}
exports.GatsbyProcessor = GatsbyProcessor;
