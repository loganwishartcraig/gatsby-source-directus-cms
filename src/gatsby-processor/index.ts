import createNodeHelpers from 'gatsby-node-helpers'
import { ContentMesh } from '../content-mesh';
import { GatsbyType } from './gatsby-type';

export interface GatsbyProcessorConfig {
    typePrefix?: string;
    includeJunctions?: boolean;
    downloadFiles?: boolean;
}


export class GatsbyProcessor {

    private _typePrefix: string = 'Directus';
    private _includeJunctions: boolean = false;
    private _downloadFiles: boolean = true;

    public gatsby: any;
    public createNodeFactory: any;
    public generateNodeId: any;

    constructor(config: GatsbyProcessorConfig, gatsby: any) {

        if (typeof config.typePrefix === 'string') {
            this._typePrefix = config.typePrefix;
        }

        if (typeof config.includeJunctions === 'boolean') {
            this._includeJunctions = config.includeJunctions;
        }

        if (typeof config.downloadFiles === 'boolean') {
            this._downloadFiles = config.downloadFiles;
        }

        const { createNodeFactory, generateNodeId } = createNodeHelpers({
            typePrefix: this._typePrefix
        });

        this.createNodeFactory = createNodeFactory;
        this.generateNodeId = generateNodeId;
        this.gatsby = gatsby;

    }

    public async processMesh(mesh: ContentMesh): Promise<any[]> {

        const nodes = await Promise.all(mesh.getCollections()
            .filter(({ isJunction }) => !isJunction || this._includeJunctions)
            .map(collection => new GatsbyType(collection, this).buildNodes()))

        return Promise.all(nodes.flat().map(node => (
            this.gatsby.actions.createNode(node)
        )));

    }

    public get downloadFiles(): boolean {
        return this._downloadFiles;
    }

}
