"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gatsby_record_1 = require("../gatsby-record");
const pluralize_1 = __importDefault(require("pluralize"));
const __1 = require("..");
class GatsbyNode {
    constructor(collection) {
        this._name = GatsbyNode.getNodeName(collection);
        this._nodes = collection.getNodes().map(node => new gatsby_record_1.GatsbyRecord(node));
    }
    static getNodeName({ name }) {
        const singularName = pluralize_1.default.isPlural(name) ? pluralize_1.default.singular(name) : name;
        const strippedName = name.match(/^directus/) ? singularName.replace('directus', '') : singularName;
        return `${strippedName[0].toUpperCase()}${strippedName.slice(1)}`;
    }
    buildNodes() {
        const generator = __1.createNodeFactory(this._name);
        return this._nodes.map(node => generator(node.toJSON()));
    }
    get name() {
        return this._name;
    }
}
exports.GatsbyNode = GatsbyNode;
