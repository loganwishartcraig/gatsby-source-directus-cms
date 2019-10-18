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
const gatsby_record_1 = require("../gatsby-record");
const pluralize_1 = __importDefault(require("pluralize"));
const gatsby_source_filesystem_1 = require("gatsby-source-filesystem");
const utils_1 = require("../../utils");
class GatsbyNode {
    constructor(collection, processor) {
        this._processor = processor;
        this._collection = collection;
        this._name = GatsbyNode.getNodeName(collection);
        this._nodes = collection.getNodes().map(node => new gatsby_record_1.GatsbyRecord(node, processor));
    }
    static getNodeName({ name }) {
        const singularName = pluralize_1.default.isPlural(name) ? pluralize_1.default.singular(name) : name;
        const strippedName = name.match(/^directus/) ? singularName.replace('directus', '') : singularName;
        return `${strippedName[0].toUpperCase()}${strippedName.slice(1)}`;
    }
    _buildFileNodes() {
        return __awaiter(this, void 0, void 0, function* () {
            const generator = this._processor.createNodeFactory(this._name);
            const baseConfig = {
                store: this._processor.gatsby.store,
                cache: this._processor.gatsby.cache,
                createNode: this._processor.gatsby.actions.createNode,
                createNodeId: this._processor.gatsby.createNodeId,
                reporter: undefined
            };
            const allNodes = yield Promise.all(this._nodes.map(node => {
                const localNode = node.toJSON();
                return gatsby_source_filesystem_1.createRemoteFileNode(Object.assign(Object.assign({}, baseConfig), { url: localNode.data.full_url })).then(remoteNode => {
                    localNode.localFile___NODE = remoteNode.id;
                }).catch(e => {
                    utils_1.log.error(`Failed to download remote file: ${localNode.data.full_url}`);
                    utils_1.log.error('File will not be available through transforms.');
                }).then(() => generator(localNode));
            }));
            return allNodes;
        });
    }
    _buildNormalNodes() {
        const generator = this._processor.createNodeFactory(this._name);
        return this._nodes.map(node => generator(node.toJSON()));
    }
    buildNodes() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._collection.isFileCollection && this._processor.downloadFiles) {
                return this._buildFileNodes();
            }
            else {
                return this._buildNormalNodes();
            }
        });
    }
    get name() {
        return this._name;
    }
}
exports.GatsbyNode = GatsbyNode;
