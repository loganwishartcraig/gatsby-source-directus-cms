import { ContentNode } from "../../content-mesh";
import { GatsbyNode } from "../gatsby-node";
import { GatsbyProcessor } from "..";

export class GatsbyRecord {

    private _node: ContentNode;
    private _processor: GatsbyProcessor;

    constructor(node: ContentNode, processor: GatsbyProcessor) {
        this._node = node;
        this._processor = processor;
    }

    public getIds(node: ContentNode | ContentNode[]): string | string[] {

        if (Array.isArray(node)) {
            return node.map(node => this._resolveId(node));
        }

        return this._resolveId(node);

    }

    private _resolveId(node: ContentNode): string {
        return this._processor.generateNodeId(GatsbyNode.getNodeName(node.getCollection()), node.primaryKey);
    }

    private static _formatFieldName(field: string): string {
        return `${field}___NODE`;
    }

    public toJSON(): any {

        const relations = { ...this._node.getRelations() };

        // Ensure ID field is set to the primary key.
        const contents = {
            ...this._node.contents,
            id: this._node.primaryKey
        };

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
