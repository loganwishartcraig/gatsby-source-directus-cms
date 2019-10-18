"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
class FileContentRelation extends __1.ContentRelation {
    constructor(config) {
        super({
            destField: config.destField,
            destTable: config.destTable,
            mesh: config.mesh,
            srcTable: config.fileTable,
            srcField: 'id',
        });
    }
    _resolveNodeRelation(node, tableType) {
        // We won't crete relations for the file nodes.
        if (tableType === 'src') {
            return;
        }
        const existing = node.contents[this._destField];
        if (existing)
            return this._srcTable.getByRecord(existing);
    }
}
exports.FileContentRelation = FileContentRelation;
