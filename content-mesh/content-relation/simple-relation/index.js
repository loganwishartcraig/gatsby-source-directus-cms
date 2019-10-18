"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
class SimpleContentRelation extends __1.ContentRelation {
    constructor(config) {
        super(config);
    }
    _resolveNodeRelation(node, tableType) {
        if (tableType === 'src') {
            const existing = node.contents[this._srcField] || [];
            return existing
                .map(record => this._destTable.getByRecord(record))
                .filter(node => !!node);
        }
        else {
            const existing = node.contents[this._destField];
            if (existing)
                return this._srcTable.getByRecord(existing);
        }
    }
}
exports.SimpleContentRelation = SimpleContentRelation;
