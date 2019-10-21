import DirectusSDK from '@directus/sdk-js';
import { IFile } from "@directus/sdk-js/dist/types/schemes/directus/File";
import { log } from "../utils";
import { ICollection } from "@directus/sdk-js/dist/types/schemes/directus/Collection";
import { ICollectionResponse } from "@directus/sdk-js/dist/types/schemes/response/Collection";
import { IConfigurationOptions } from '@directus/sdk-js/dist/types/Configuration';

export interface DirectusServiceConfig {
    url: string;

    auth?: {
        email?: string;
        password?: string;
        token?: string;
    }

    project?: string;
    fileCollectionName?: string;
    targetStatuses?: string[] | void;

    allowCollections?: string[] | void;
    blockCollections?: string[] | void;

    customRecordFilter?: (record: any, collection: string) => boolean;
}

export class DirectusService {

    private static _voidStatusKey: string = '__NONE__';

    private _fileCollectionName: string = 'directus_files';
    private _targetStatuses: string[] | void = ['published', DirectusService._voidStatusKey];
    private _includeInternalCollections: boolean = false;
    private _customRecordFilter?: (record: any, collection: string) => boolean;

    private _allowCollections: string[] | void;
    private _blockCollections: string[] | void;

    private _api: DirectusSDK;
    private _ready: Promise<void>;

    constructor(config: DirectusServiceConfig) {

        if (config.fileCollectionName) {
            this._fileCollectionName = config.fileCollectionName;
        }

        if (config.hasOwnProperty('targetStatuses')) {
            this._targetStatuses = config.targetStatuses;
        }

        if (typeof config.customRecordFilter === 'function') {
            this._customRecordFilter = config.customRecordFilter;
        }

        this._allowCollections = config.allowCollections;
        this._blockCollections = config.blockCollections;

        this._api = this._initSDK(config);
        this._ready = this._initAuth(config);

    }

    private _initSDK({
        url,
        project,
        auth = {}
    }: DirectusServiceConfig): DirectusSDK {

        const config: IConfigurationOptions = {
            url,
            project,
        };

        if (auth.token) {
            config.token = auth.token;
            config.persist = true;
        }

        return new DirectusSDK(config);
    }

    private async _initAuth({ auth: { token, email, password } = {} }: DirectusServiceConfig): Promise<void> {

        if (token) {
            return;
        } else if (email && password) {
            return this._login({ email, password })
        }

        log.warn('No authentication details provided. Will try using the public API...');

    }


    private async _login(credentials: { email: string; password: string }): Promise<void> {

        try {

            if (!this._api.loggedIn) {

                const response = await this._api.login(credentials, { persist: true, storage: true });

                if (!response || !response.token) {
                    throw new Error('Invalid response returned.');
                }

                log.success('Authentication successful.')

            }


        } catch (e) {
            log.warn('Failed to login into Directus using the credentials provided. Will try using the public API...');
        }

    }

    private _shouldIncludeCollection(collection: string, managed: boolean): boolean {

        if (this._allowCollections && !this._allowCollections.includes(collection)) {
            return false;
        } else if (this._blockCollections && this._blockCollections.includes(collection)) {
            return false;
        }

        return this._includeInternalCollections || managed;


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

            return collections.filter(({ collection, managed }) => this._shouldIncludeCollection(collection, managed));

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
