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
Object.defineProperty(exports, "__esModule", { value: true });
const gatsby_type_1 = require("../gatsby-type");
const gatsby_source_filesystem_1 = require("gatsby-source-filesystem");
const utils_1 = require("../../utils");
class GatsbyNode {
    constructor(node, processor) {
        this._node = node;
        this._processor = processor;
    }
    getIds(node) {
        if (Array.isArray(node)) {
            return node.map(node => this._resolveId(node));
        }
        return this._resolveId(node);
    }
    _resolveId(node) {
        return this._processor.generateNodeId(gatsby_type_1.GatsbyType.getTypeName(node.getCollection()), node.primaryKey);
    }
    static _formatFieldName(field) {
        return `${field}___NODE`;
    }
    _mixinRelations(contents) {
        return Object
            .entries(this._node.getRelations())
            .reduce((newContents, [field, relation]) => {
            delete newContents[field];
            const newFieldName = GatsbyNode._formatFieldName(field);
            newContents[newFieldName] = this.getIds(relation.getRelatedNodes());
            return newContents;
        }, Object.assign({}, contents));
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure ID field is set to the primary key.
            const contents = Object.assign(Object.assign({}, this._node.contents), { id: this._node.primaryKey });
            if (this._node.getCollection().acceptsRelations()) {
                return this._mixinRelations(contents);
            }
            return contents;
        });
    }
}
exports.GatsbyNode = GatsbyNode;
class GatsbyFileNode extends GatsbyNode {
    build() {
        const _super = Object.create(null, {
            build: { get: () => super.build }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const localNode = yield _super.build.call(this);
            try {
                const remoteNode = yield gatsby_source_filesystem_1.createRemoteFileNode({
                    store: this._processor.gatsby.store,
                    cache: this._processor.gatsby.cache,
                    createNode: this._processor.gatsby.actions.createNode,
                    createNodeId: this._processor.gatsby.createNodeId,
                    reporter: undefined,
                    url: localNode.data.full_url,
                });
                localNode.localFile___NODE = remoteNode.id;
            }
            catch (e) {
                utils_1.log.error(`Failed to download remote file: ${localNode.data.full_url}`);
                utils_1.log.error('File will not be available through transforms.');
            }
            return localNode;
        });
    }
}
exports.GatsbyFileNode = GatsbyFileNode;
