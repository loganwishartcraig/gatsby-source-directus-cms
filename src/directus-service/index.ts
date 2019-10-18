import DirectusSDK from '@directus/sdk-js';
import { IFile } from "@directus/sdk-js/dist/types/schemes/directus/File";
import { log } from "../utils";
import { ICollection } from "@directus/sdk-js/dist/types/schemes/directus/Collection";
import { ICollectionResponse } from "@directus/sdk-js/dist/types/schemes/response/Collection";

export interface DirectusServiceConfig {
    url: string;
    email: string;
    password: string;
    project?: string;
    fileCollectionName?: string;
    targetStatuses?: string[] | void;
    customRecordFilter?: (record: any, collection: string) => boolean;
}

export class DirectusService {

    private static _voidStatusKey: string = '__NONE__';

    private _url: string;
    private _project: string;
    private _email: string;
    private _password: string;
    private _fileCollectionName: string = 'directus_files';
    private _targetStatuses: string[] | void = ['published', DirectusService._voidStatusKey];
    private _includeInternalCollections: boolean = false;
    private _customRecordFilter?: (record: any, collection: string) => boolean;

    private _api: DirectusSDK;
    private _ready: Promise<void>;

    constructor(config: DirectusServiceConfig) {

        this._url = config.url;
        this._project = config.project || '';
        this._email = config.email;
        this._password = config.password;

        if (config.fileCollectionName) {
            this._fileCollectionName = config.fileCollectionName;
        }

        if (config.hasOwnProperty('targetStatuses')) {
            this._targetStatuses = config.targetStatuses;
        }

        if (typeof config.customRecordFilter === 'function') {
            this._customRecordFilter = config.customRecordFilter;
        }

        this._api = new DirectusSDK({
            url: this._url,
            project: this._project
        });

    }

    private async _login(): Promise<void> {

        try {

            const response = await this._api.login({
                email: this._email,
                password: this._password
            });

            if (!response || !response.token) {
                throw new Error('Invalid response returned.');
            }

            log.success('Authentication successful.')

        } catch (e) {
            log.warn('Failed to login to Directus, will try using the public API...');
        }

    }

    private _shouldIncludeRecord(record: any, collection: string): boolean {

        const { status } = record;

        if (typeof this._customRecordFilter === 'function') {
            return this._customRecordFilter(record, collection);
        }

        if (!this._targetStatuses) return true;

        if (!status) return this._targetStatuses.includes(DirectusService._voidStatusKey);

        return this._targetStatuses.includes(record.status);

    }

    public async init(): Promise<void> {

        log.info('Initializing Directus Service...');

        if (!this._ready) {
            this._ready = this._login();
        }

        await this._ready;

    }

    public async getCollection(collectionId: string): Promise<ICollectionResponse> {

        try {

            log.info(`Fetching collection info for "${collectionId}"`);
            const response = await this._api.getCollection(collectionId);

            return response;

        } catch (e) {
            log.error(`Failed to fetch collection ${collectionId}`);
            throw e;
        }

    }

    public async getFilesCollection(): Promise<ICollection> {

        try {
            log.info(`Fetching files collection using name "${this._fileCollectionName}"`);

            // For some reason, api.getCollection(this._fileCollectionName) is not working
            // at time of authorship.
            const { data: collections } = await this._api.getCollections() as any;

            const [fileCollection] = collections.filter(
                ({ collection }) => collection === this._fileCollectionName
            );

            if (!fileCollection) {
                throw new Error('No collection matching the given name found');
            }

            return fileCollection;

        } catch (e) {
            log.error('Failed to fetch files collection');
            throw e;
        }

    }

    public async batchGetCollections(): Promise<ICollection[]> {

        try {

            log.info('Fetching all collections...');

            // Currently we don't consider non-managed Directus tables.
            const { data: collections } = await this._api.getCollections() as any;

            return collections.filter(({ managed }) => this._includeInternalCollections || managed);

        } catch (e) {
            log.error('Failed to fetch collections');
            throw e;
        }

    }

    public async batchGetRelations(): Promise<any> {

        try {

            log.info('Fetching all relations...');

            const { data: relations } = await this._api.getRelations();

            return relations;

        } catch (e) {

            log.error('Failed to fetch relations');
            throw e;

        }

    }

    public async getCollectionRecords(collection: string): Promise<any[]> {

        try {

            log.info(`Fetching records for ${collection}...`);

            const { data: items } = await this._api.getItems(collection, {
                fields: '*.*'
            });

            return items.filter(record => this._shouldIncludeRecord(record, collection));

        } catch (e) {
            log.error(`Failed to fetch records for collection "${collection}"`);
            log.error(`Did you grant READ permissions?`);
            throw e;
        }

    }

    public batchGetCollectionRecords(collections: ICollection[]): Promise<{ [collection: string]: any[] }> {

        log.info('Fetching all records...');

        return Promise.all(
            collections.map(
                ({ collection }) => this.getCollectionRecords(collection)
            )).then(recordSets => {

                return recordSets.reduce((recordMap, records, i) => {
                    recordMap[collections[i].collection] = records;
                    return recordMap;
                }, {} as { [collection: string]: any[] });

            });

    }

    public async getAllFiles(): Promise<IFile[]> {

        try {

            log.info('Fetching all files...');

            const { data } = await this._api.getFiles();

            return data.flat();

        } catch (e) {
            log.error('Failed to fetch files.');
            log.error(`Did you grant READ permissions?`);
            throw e;
        }

    }

}
