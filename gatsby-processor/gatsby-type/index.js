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
const pluralize_1 = __importDefault(require("pluralize"));
const gatsby_node_1 = require("../gatsby-node");
class GatsbyType {
    constructor(collection, processor) {
        this._processor = processor;
        this._collection = collection;
        this._name = GatsbyType.getTypeName(collection);
        this._nodes = this._initNodes(collection.getNodes());
    }
    static getTypeName({ name }) {
        const singularName = pluralize_1.default.isPlural(name) ? pluralize_1.default.singular(name) : name;
        const strippedName = name.match(/^directus/) ? singularName.replace('directus', '') : singularName;
        return `${strippedName[0].toUpperCase()}${strippedName.slice(1)}`;
    }
    _initNodes(nodes = []) {
        return nodes.map(node => {
            if (this._collection.isFileCollection && this._processor.downloadFiles) {
                return new gatsby_node_1.GatsbyFileNode(node, this._processor);
            }
            return new gatsby_node_1.GatsbyNode(node, this._processor);
        });
    }
    buildNodes() {
        return __awaiter(this, void 0, void 0, function* () {
            const formatter = this._processor.createNodeFactory(this._name);
            const nodes = yield Promise.all(this._nodes.map(node => node.build()));
            return nodes.map(node => formatter(node));
        });
    }
    get name() {
        return this._name;
    }
}
exports.GatsbyType = GatsbyType;
