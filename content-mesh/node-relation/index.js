"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NodeRelation {
    constructor(config) {
        this.field = config.field;
        this._related = config.related;
    }
    getRelatedNodes() {
        return this._related;
    }
}
exports.NodeRelation = NodeRelation;
