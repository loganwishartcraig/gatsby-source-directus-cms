"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const content_mesh_1 = require("./content-mesh");
const utils_1 = require("./utils");
const directus_service_1 = require("./directus-service");
const gatsby_processor_1 = require("./gatsby-processor");
exports.sourceNodes = (gatsby, config) => __awaiter(this, void 0, void 0, function* () {
    utils_1.log.info(`Starting...`);
    utils_1.log.info(`Target: ${config.url}/${config.project}`);
    const service = new directus_service_1.DirectusService(config);
    try {
        yield service.init();
        const collections = yield service.batchGetCollections();
        const records = yield service.batchGetCollectionRecords(collections);
        const relations = yield service.batchGetRelations();
        const files = yield service.getAllFiles();
        const fileCollection = yield service.getFilesCollection();
        const contentMesh = new content_mesh_1.ContentMesh({
            collections: [...collections, fileCollection],
            records: Object.assign({}, records, { [fileCollection.collection]: files }),
            relations
        });
        const processor = new gatsby_processor_1.GatsbyProcessor(config, gatsby);
        yield processor.processMesh(contentMesh);
        utils_1.log.success('Processing complete');
    }
    catch (e) {
        utils_1.log.error('Failed to build Directus nodes', { e });
    }
});
