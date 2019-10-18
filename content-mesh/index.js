"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const content_collection_1 = require("./content-collection");
const content_relation_1 = require("./content-relation");
const utils_1 = require("../utils");
/**
 * A container for the entire content graph
 * as represented in Directus.
 */
class ContentMesh {
    constructor(config) {
        /** All collections processed, indexed by collection name. */
        this._collections = {};
        this._collections = this._buildCollections(config);
        this._buildRelations(config.relations)
            .forEach(relation => relation.applyRecordUpdates());
    }
    /**
     * Builds all relations to be processed by the mesh.
     *
     * @param relations The original relations as returned by Directus.
     */
    _buildRelations(relations = []) {
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
    _buildO2MRelations(relations = []) {
        return relations.reduce((bag, relation) => {
            const { collection_many, collection_one, field_many, field_one } = relation;
            if (!this._shouldProcessRelation(relation, 'o2m')) {
                return bag;
            }
            const destTable = this.getCollection(collection_many);
            const srcTable = this.getCollection(collection_one);
            // Only process relations for tables that exist.
            if (!destTable || !srcTable) {
                // Warn the user if we think the relation should have been processed.
                if (!collection_many.match(/^directus/) || !collection_one.match(/^directus/)) {
                    utils_1.log.warn('Unable to resolve Directus relation', { config: relation, srcTable, destTable });
                    utils_1.log.warn('Have these collections in memory', { collections: Object.keys(this._collections) });
                }
                return bag;
            }
            utils_1.log.info(`Creating O2M relation for ${destTable.name}.${field_many} -> ${srcTable.name}.${field_one}`);
            bag.push(new content_relation_1.SimpleContentRelation({
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
    _buildM2MRelations(relations = []) {
        const junctions = {};
        relations.forEach(relation => {
            // Only process M2M, non-internal relations
            if (!this._shouldProcessRelation(relation, 'm2m')) {
                return;
            }
            // M2M relations are connected via the 'collection_many' junction table.
            if (!junctions[relation.collection_many]) {
                junctions[relation.collection_many] = [relation];
            }
            else {
                junctions[relation.collection_many].push(relation);
            }
        });
        // Process each junction pair.
        return Object.values(junctions).reduce((bag, [a, b]) => {
            if (!a || !b) {
                utils_1.log.warn('Unable to resolve Directus junction. Missing junction information.', { a, b });
                return bag;
            }
            const destTable = this.getCollection(a.collection_one);
            const srcTable = this.getCollection(b.collection_one);
            const junctionTable = this.getCollection(a.collection_many);
            if (!destTable || !srcTable || !junctionTable) {
                utils_1.log.warn('Unable to resolve Directus junction. Missing collections', { destTable, srcTable, junctionTable, a, b });
                utils_1.log.warn('Have these tables in memory', { collections: Object.keys(this._collections) });
                utils_1.log.warn('This may be a result of Directus keeping deleted junction information in internal tables.');
                return bag;
            }
            utils_1.log.info(`Creating M2M relation for ${destTable.name} <-> ${srcTable.name}`);
            bag.push(new content_relation_1.JunctionContentRelation({
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
    _buildFileRelations() {
        const fileTable = this.getCollection('directus_files');
        if (!fileTable) {
            utils_1.log.error(`Couldn't resolve the internal file table using the name "directus_files"`);
            return [];
        }
        return Object.values(this._collections).reduce((bag, collection) => {
            Object.values(collection.fields)
                .filter(({ type }) => type === 'file')
                .forEach(({ field }) => {
                utils_1.log.info(`Creating File relation for ${collection.name}.${field}`);
                bag.push(new content_relation_1.FileContentRelation({
                    destField: field,
                    destTable: collection,
                    mesh: this,
                    fileTable,
                }));
            });
            return bag;
        }, []);
    }
    _shouldProcessRelation({ collection_many, collection_one, junction_field }, type) {
        if (collection_many.match(/^directus/) && collection_one.match(/^directus/)) {
            return false;
        }
        switch (type) {
            case 'o2m':
                return !junction_field;
            case 'm2m':
                return !!junction_field;
            default:
                utils_1.log.error(`Internal error, unknown relation type: ${type}`);
                return false;
        }
    }
    _buildCollections({ collections, records }) {
        return collections.reduce((bag, collection) => {
            bag[collection.collection] = new content_collection_1.ContentCollection({
                collection,
                records: records[collection.collection],
            });
            return bag;
        }, {});
    }
    getCollection(id) {
        return this._collections[id];
    }
    getCollections() {
        return Object.values(this._collections);
    }
}
exports.ContentMesh = ContentMesh;
var content_collection_2 = require("./content-collection");
exports.ContentCollection = content_collection_2.ContentCollection;
var content_node_1 = require("./content-node");
exports.ContentNode = content_node_1.ContentNode;
