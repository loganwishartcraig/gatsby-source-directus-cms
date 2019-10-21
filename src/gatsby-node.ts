import { ContentMesh } from './content-mesh';
import { log } from './utils';
import { DirectusServiceConfig, DirectusService } from './directus-service';
import { GatsbyProcessor, GatsbyProcessorConfig } from './gatsby-processor';

export const sourceNodes = async (
    gatsby: any,
    config: DirectusServiceConfig & GatsbyProcessorConfig
) => {

    log.info(`Starting...`);
    log.info(`Target: ${config.url}/${config.project}`);

    const service = new DirectusService(config);

    try {

        await service.init();

        const collections = await service.batchGetCollections();
        const records = await service.batchGetCollectionRecords(collections);
        const relations = await service.batchGetRelations();
        const files = await service.getAllFiles();
        const fileCollection = await service.getFilesCollection();

        const contentMesh = new ContentMesh({
            collections: [...collections, fileCollection],
            records: { ...records, [fileCollection.collection]: files },
            relations
        });

        const processor = new GatsbyProcessor(config, gatsby);
        const nodes = await processor.processMesh(contentMesh);

        await Promise.all(nodes.map(node => (
            gatsby.actions.createNode(node)
        )));

        log.success('Processing complete');


    } catch (e) {
        log.error('Failed to build Directus nodes', { e });
    }

}
