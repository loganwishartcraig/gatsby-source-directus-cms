"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
class JunctionContentRelation extends __1.ContentRelation {
    constructor(config) {
        super(config);
        this._junctionTable = config.junctionTable;
        this._srcJunctionField = config.srcJunctionField;
        this._destJunctionField = config.destJunctionField;
        config.junctionTable.flagJunction();
    }
    _resolveNodeRelation(node, tableType) {
        const targetField = (tableType === 'src') ? this._srcField : this._destField;
        const existing = node.contents[targetField] || [];
        return existing
            .map(junctionRecord => this._resolveJunctionNodes(junctionRecord))
            .map(({ src, dest }) => (tableType === 'src' ? dest : src))
            .filter(node => node);
    }
    _resolveJunctionNodes(junctionRecord) {
        return {
            src: this._srcTable.getByPrimaryKey(junctionRecord[this._destJunctionField]),
            dest: this._destTable.getByPrimaryKey(junctionRecord[this._srcJunctionField])
        };
    }
}
exports.JunctionContentRelation = JunctionContentRelation;
