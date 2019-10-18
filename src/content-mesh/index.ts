import { ICollection } from "@directus/sdk-js/dist/types/schemes/directus/Collection";
import { IRelation } from "@directus/sdk-js/dist/types/schemes/directus/Relation";
import { ContentCollection } from "./content-collection";
import { ContentRelation, SimpleContentRelation, JunctionContentRelation, FileContentRelation, ContentRelationConfig } from "./content-relation";
import { log } from "../utils";

export interface ContentMeshConfig {
    collections: ICollection[];
    records: { [collectionId: string]: any[] };
    relations: IRelation[];
}


/**
 * A container for the entire content graph
 * as represented in Directus.
 */
export class ContentMesh {

    /** All collections processed, indexed by collection name. */
    private _collections: { [collectionName: string]: ContentCollection } = {};

    constructor(config: ContentMeshConfig) {

        this._collections = this._buildCollections(config);

        this._buildRelations(config.relations)
            .forEach(relation => relation.applyRecordUpdates());

    }

    /**
     * Builds all relations to be processed by the mesh.
     *
     * @param relations The original relations as returned by Directus.
     */
    private _buildRelations(relations: IRelation[] = []): ContentRelation[] {

        // Could do a single pass over relations, but chose
        // to do two for clarity.
        return [
            ...this._buildO2MRelations(relations),
            ...this._buildM2MRelations(relations),
            ...this._buildFileRelations()
        ];

    }

    /**
     * Builds all O2M (and M2O) relations to be processed by the mesh.
     *
     * @param relations The original relations as returned by Directus.
     */
    private _buildO2MRelations(relations: IRelation[] = []): ContentRelation[] {

        return relations.reduce((bag, relation) => {

            const {
                collection_many,
                collection_one,
                field_many,
                field_one
            } = relation;

            if (!this._shouldProcessRelation(relation, 'o2m')) {
                return bag;
            }

            const destTable = this.getCollection(collection_many);
            const srcTable = this.getCollection(collection_one);

            // Only process relations for tables that exist.
            if (!destTable || !srcTable) {

                // Warn the user if we think the relation should have been processed.
                if (!collection_many.match(/^directus/) || !collection_one.match(/^directus/)) {
                    log.warn('Unable to resolve Directus relation', { config: relation, srcTable, destTable });
                    log.warn('Have these collections in memory', { collections: Object.keys(this._collections) })
                }

                return bag;

            }

            log.info(`Creating O2M relation for ${destTable.name}.${field_many} -> ${srcTable.name}.${field_one}`);

            bag.push(new SimpleContentRelation({
                destField: field_many,
                destTable,
                srcField: field_one,
                srcTable,
                mesh: this,
            }));

            return bag;

        }, []);

    }

    /**
     * Builds all M2M relations to be processed by the mesh.
     *
     * @param relations The original relations as returned by Directus
     */
    private _buildM2MRelations(relations: IRelation[] = []): ContentRelation[] {

        const junctions: {
            [junctionTableName: string]: [IRelation, IRelation?]
        } = {};

        relations.forEach(relation => {

            // Only process M2M, non-internal relations
            if (!this._shouldProcessRelation(relation, 'm2m')) {
                return;
            }

            // M2M relations are connected via the 'collection_many' junction table.
            if (!junctions[relation.collection_many]) {
                junctions[relation.collection_many] = [relation];
            } else {
                junctions[relation.collection_many].push(relation);
            }

        });

        // Process each junction pair.
        return Object.values(junctions).reduce((bag, [a, b]) => {

            if (!a || !b) {
                log.warn('Unable to resolve Directus junction. Missing junction information.', { a, b });
                return bag;
            }

            const destTable = this.getCollection(a.collection_one);
            const srcTable = this.getCollection(b.collection_one);
            const junctionTable = this.getCollection(a.collection_many);

            if (!destTable || !srcTable || !junctionTable) {
                log.warn('Unable to resolve Directus junction. Missing collections', { destTable, srcTable, junctionTable, a, b });
                log.warn('Have these tables in memory', { collections: Object.keys(this._collections) })
                log.warn('This may be a result of Directus keeping deleted junction information in internal tables.');
                return bag;
            }

            log.info(`Creating M2M relation for ${destTable.name} <-> ${srcTable.name}`);

            bag.push(new JunctionContentRelation({
                destField: a.field_one,
                destJunctionField: a.junction_field,
                destTable,
                srcField: b.field_one,
                srcJunctionField: b.junction_field,
                srcTable,
                junctionTable,
                mesh: this,
            }));

            return bag;

        }, []);

    }

    private _buildFileRelations(): ContentRelation[] {

        const fileTable = this.getCollection('directus_files');

        if (!fileTable) {
            log.error(`Couldn't resolve the internal file table using the name "directus_files"`);
            return [];
        }

        return Object.values(this._collections).reduce((bag, collection) => {

            Object.values(collection.fields)
                .filter(({ type }) => type === 'file')
                .forEach(({ field }) => {

                    log.info(`Creating File relation for ${collection.name}.${field}`);

                    bag.push(new FileContentRelation({
                        destField: field,
                        destTable: collection,
                        mesh: this,
                        fileTable,
                    }));

                });

            return bag;

        }, []);

    }

    private _shouldProcessRelation({
        collection_many,
        collection_one,
        junction_field
    }: IRelation, type: 'o2m' | 'm2m'): boolean {

        if (collection_many.match(/^directus/) && collection_one.match(/^directus/)) {
            return false;
        }

        switch (type) {
            case 'o2m':
                return !junction_field;
            case 'm2m':
                return !!junction_field;
            default:
                log.error(`Internal error, unknown relation type: ${type}`);
                return false;

        }

    }

    private _buildCollections({
        collections,
        records
    }: ContentMeshConfig): { [collectionId: string]: ContentCollection } {

        return collections.reduce((bag, collection) => {

            bag[collection.collection] = new ContentCollection({
                collection,
                records: records[collection.collection],
            });

            return bag;

        }, {});

    }

    public getCollection(id: string): ContentCollection | void {
        return this._collections[id];
    }

    public getCollections(): ContentCollection[] {
        return Object.values(this._collections);
    }

}

export { ContentCollection } from './content-collection';
export { ContentNode } from './content-node';
