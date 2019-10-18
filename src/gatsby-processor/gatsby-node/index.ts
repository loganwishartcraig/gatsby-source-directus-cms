import { GatsbyRecord } from "../gatsby-record";
import Pluralize from 'pluralize';
import { ContentCollection } from "../../content-mesh";
import { GatsbyProcessor } from "..";
import { createRemoteFileNode } from 'gatsby-source-filesystem';
import { log } from "../../utils";

export class GatsbyNode {

    private _nodes: GatsbyRecord[];
    private _name: string;
    private _collection: ContentCollection;

    private _processor: GatsbyProcessor;

    constructor(collection: ContentCollection, processor: GatsbyProcessor) {
        this._processor = processor;
        this._collection = collection;
        this._name = GatsbyNode.getNodeName(collection);
        this._nodes = collection.getNodes().map(node => new GatsbyRecord(node, processor));
    }

    public static getNodeName({ name }: ContentCollection): string {

        const singularName = Pluralize.isPlural(name) ? Pluralize.singular(name) : name;
        const strippedName = name.match(/^directus/) ? singularName.replace('directus', '') : singularName;

        return `${strippedName[0].toUpperCase()}${strippedName.slice(1)}`
    }

    private async _buildFileNodes(): Promise<any[]> {

        const generator = this._processor.createNodeFactory(this._name);

        const baseConfig = {
            store: this._processor.gatsby.store,
            cache: this._processor.gatsby.cache,
            createNode: this._processor.gatsby.actions.createNode,
            createNodeId: this._processor.gatsby.createNodeId,
            reporter: undefined
        };

        const allNodes = await Promise.all(this._nodes.map(node => {

            const localNode = node.toJSON();

            return createRemoteFileNode({
                ...baseConfig,
                url: localNode.data.full_url,
            }).then(remoteNode => {
                localNode.localFile___NODE = (remoteNode as any).id;
            }).catch(e => {
                log.error(`Failed to download remote file: ${localNode.data.full_url}`);
                log.error('File will not be available through transforms.')
            }).then(() => generator(localNode));

        }));

        return allNodes;

    }

    private _buildNormalNodes(): any[] {

        const generator = this._processor.createNodeFactory(this._name);

        return this._nodes.map(node => generator(node.toJSON()));
    }

    public async buildNodes(): Promise<any[]> {

        if (this._collection.isFileCollection && this._processor.downloadFiles) {
            return this._buildFileNodes();
        } else {
            return this._buildNormalNodes();
        }

    }

    public get name(): string {
        return this._name;
    }

}
