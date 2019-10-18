"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ContentNode {
    constructor(config) {
        this._relations = {};
        this._record = config.record;
        this._primaryKeyFieldName = config.primaryKeyFieldName;
        this._collection = config.collection;
    }
    get primaryKey() {
        return this._record[this._primaryKeyFieldName];
    }
    get contents() {
        return this._record;
    }
    addRelation(relation) {
        this._relations[relation.field] = relation;
    }
    getRelations() {
        return this._relations;
    }
    getCollection() {
        return this._collection;
    }
}
exports.ContentNode = ContentNode;
