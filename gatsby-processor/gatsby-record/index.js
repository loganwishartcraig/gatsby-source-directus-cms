"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gatsby_node_1 = require("../gatsby-node");
class GatsbyRecord {
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
        return this._processor.generateNodeId(gatsby_node_1.GatsbyNode.getNodeName(node.getCollection()), node.primaryKey);
    }
    static _formatFieldName(field) {
        return `${field}___NODE`;
    }
    toJSON() {
        const relations = Object.assign({}, this._node.getRelations());
        // Ensure ID field is set to the primary key.
        const contents = Object.assign(Object.assign({}, this._node.contents), { id: this._node.primaryKey });
        // Produce foreign node connections if not internal node
        if (this._node.getCollection().acceptsRelations()) {
            Object.entries(relations).forEach(([field, relation]) => {
                delete contents[field];
                contents[GatsbyRecord._formatFieldName(field)] = this.getIds(relation.getRelatedNodes());
            });
        }
        return contents;
    }
}
exports.GatsbyRecord = GatsbyRecord;
