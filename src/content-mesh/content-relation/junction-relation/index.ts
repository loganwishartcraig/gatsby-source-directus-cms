import { ContentCollection } from "../../content-collection";
import { ContentRelationConfig, ContentRelation } from "..";
import { ContentNode } from "../../content-node";

export interface JunctionContentRelationConfig extends ContentRelationConfig {
    srcJunctionField: string;
    destJunctionField: string;
    junctionTable: ContentCollection;
}

export class JunctionContentRelation extends ContentRelation {

    protected _srcJunctionField: string;
    protected _destJunctionField: string;
    protected _junctionTable: ContentCollection;

    constructor(config: JunctionContentRelationConfig) {

        super(config);
        this._junctionTable = config.junctionTable;
        this._srcJunctionField = config.srcJunctionField;
        this._destJunctionField = config.destJunctionField;

        config.junctionTable.flagJunction();

    }

    protected _resolveNodeRelation(node: ContentNode, tableType: 'src' | 'dest'): void | ContentNode | ContentNode[] {

        const targetField = (tableType === 'src') ? this._srcField : this._destField;
        const existing = node.contents[targetField] || [];

        return existing
            .map(junctionRecord => this._resolveJunctionNodes(junctionRecord))
            .map(({ src, dest }) => (tableType === 'src' ? dest : src))
            .filter(node => node);

    }

    protected _resolveJunctionNodes(junctionRecord: any): { src: ContentNode | void; dest: ContentNode | void; } {

        return {
            src: this._srcTable.getByPrimaryKey(junctionRecord[this._destJunctionField]),
            dest: this._destTable.getByPrimaryKey(junctionRecord[this._srcJunctionField])
        };

    }

}
