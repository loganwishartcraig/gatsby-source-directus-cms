"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_relation_1 = require("../node-relation");
class ContentRelation {
    constructor(config) {
        this._srcField = config.srcField;
        this._srcTable = config.srcTable;
        this._destField = config.destField;
        this._destTable = config.destTable;
        this._mesh = config.mesh;
    }
    _updateTable(table, tableType) {
        if (!table.acceptsRelations())
            return;
        table.getNodes().forEach(node => {
            const related = this._resolveNodeRelation(node, tableType);
            const field = (tableType === 'src') ? this._srcField : this._destField;
            if (related) {
                node.addRelation(new node_relation_1.NodeRelation({
                    field,
                    related
                }));
            }
        });
    }
    applyRecordUpdates() {
        this._updateTable(this._srcTable, 'src');
        if (!this._isSelfJoin()) {
            this._updateTable(this._destTable, 'dest');
        }
    }
    _isSelfJoin() {
        return this._srcTable.name === this._destTable.name;
    }
}
exports.ContentRelation = ContentRelation;
var simple_relation_1 = require("./simple-relation");
exports.SimpleContentRelation = simple_relation_1.SimpleContentRelation;
var junction_relation_1 = require("./junction-relation");
exports.JunctionContentRelation = junction_relation_1.JunctionContentRelation;
var file_relation_1 = require("./file-relation");
exports.FileContentRelation = file_relation_1.FileContentRelation;
