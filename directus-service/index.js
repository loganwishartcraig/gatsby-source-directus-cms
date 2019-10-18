"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_js_1 = __importDefault(require("@directus/sdk-js"));
const utils_1 = require("../utils");
class DirectusService {
    constructor(config) {
        this._fileCollectionName = 'directus_files';
        this._targetStatuses = ['published', DirectusService._voidStatusKey];
        this._includeInternalCollections = false;
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
        this._api = new sdk_js_1.default({
            url: this._url,
            project: this._project
        });
    }
    _login() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this._api.login({
                    email: this._email,
                    password: this._password
                });
                if (!response || !response.token) {
                    throw new Error('Invalid response returned.');
                }
                utils_1.log.success('Authentication successful.');
            }
            catch (e) {
                utils_1.log.warn('Failed to login to Directus, will try using the public API...');
            }
        });
    }
    _shouldIncludeRecord(record, collection) {
        const { status } = record;
        if (typeof this._customRecordFilter === 'function') {
            return this._customRecordFilter(record, collection);
        }
        if (!this._targetStatuses)
            return true;
        if (!status)
            return this._targetStatuses.includes(DirectusService._voidStatusKey);
        return this._targetStatuses.includes(record.status);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            utils_1.log.info('Initializing Directus Service...');
            if (!this._ready) {
                this._ready = this._login();
            }
            yield this._ready;
        });
    }
    getCollection(collectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                utils_1.log.info(`Fetching collection info for "${collectionId}"`);
                const response = yield this._api.getCollection(collectionId);
                return response;
            }
            catch (e) {
                utils_1.log.error(`Failed to fetch collection ${collectionId}`);
                throw e;
            }
        });
    }
    getFilesCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                utils_1.log.info(`Fetching files collection using name "${this._fileCollectionName}"`);
                // For some reason, api.getCollection(this._fileCollectionName) is not working
                // at time of authorship.
                const { data: collections } = yield this._api.getCollections();
                const [fileCollection] = collections.filter(({ collection }) => collection === this._fileCollectionName);
                if (!fileCollection) {
                    throw new Error('No collection matching the given name found');
                }
                return fileCollection;
            }
            catch (e) {
                utils_1.log.error('Failed to fetch files collection');
                throw e;
            }
        });
    }
    batchGetCollections() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                utils_1.log.info('Fetching all collections...');
                // Currently we don't consider non-managed Directus tables.
                const { data: collections } = yield this._api.getCollections();
                return collections.filter(({ managed }) => this._includeInternalCollections || managed);
            }
            catch (e) {
                utils_1.log.error('Failed to fetch collections');
                throw e;
            }
        });
    }
    batchGetRelations() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                utils_1.log.info('Fetching all relations...');
                const { data: relations } = yield this._api.getRelations();
                return relations;
            }
            catch (e) {
                utils_1.log.error('Failed to fetch relations');
                throw e;
            }
        });
    }
    getCollectionRecords(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                utils_1.log.info(`Fetching records for ${collection}...`);
                const { data: items } = yield this._api.getItems(collection, {
                    fields: '*.*'
                });
                return items.filter(record => this._shouldIncludeRecord(record, collection));
            }
            catch (e) {
                utils_1.log.error(`Failed to fetch records for collection "${collection}"`);
                utils_1.log.error(`Did you grant READ permissions?`);
                throw e;
            }
        });
    }
    batchGetCollectionRecords(collections) {
        utils_1.log.info('Fetching all records...');
        return Promise.all(collections.map(({ collection }) => this.getCollectionRecords(collection))).then(recordSets => {
            return recordSets.reduce((recordMap, records, i) => {
                recordMap[collections[i].collection] = records;
                return recordMap;
            }, {});
        });
    }
    getAllFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                utils_1.log.info('Fetching all files...');
                const { data } = yield this._api.getFiles();
                return data.flat();
            }
            catch (e) {
                utils_1.log.error('Failed to fetch files.');
                utils_1.log.error(`Did you grant READ permissions?`);
                throw e;
            }
        });
    }
}
exports.DirectusService = DirectusService;
DirectusService._voidStatusKey = '__NONE__';
