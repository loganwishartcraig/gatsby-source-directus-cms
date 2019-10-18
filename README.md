# Gatsby Source Directus CMS

A [Gatsby](https://www.gatsbyjs.org/) source plugin to pull content from a [Directus CMS](https://directus.io/) backend.

Inspired by the [gatsby-source-directus7](https://github.com/Jonesus/gatsby-source-directus7) plugin by [Joonas Palosuo](https://github.com/Jonesus)

## Features

- Exposes all custom content types & associated records created in Directus as distinct nodes in the Gatsby GraphQL layer
- Mirrors O2M, M2O, M2M, and "File" relations between content types in Directus in the Graph QL layer
- Downloads files hosted in Directus for usage with other [Gatsby transformer plugins](https://www.gatsbyjs.org/plugins/?=gatsby-transformer)

## Installation

Installing the plugin is no different than installing other Gatsby source plugins.

1) Create a gatsby project. For help, see the Gatsby quick start guide [here](https://www.gatsbyjs.org/docs/quick-start)
2) Install the plugin using ```npm install --save gatsby-source-directus-cms```
3) Edit your ```gatsby-config.js```. See below for details.

## Configuration

### Options

Find details regarding the ```options``` object schema below. Default values specified when used.

**Required**

 - ```url: string``` &ndash; The base url for the project's Directus API.
 - ```email: string``` &ndash; Directus login email.This user should have ```read``` access to all tables, including system tables.
 - ```password: string```  &ndash; Directus login password.

**Optional**

 - ```project: string``` &ndash; **Default:** ```"_"``` &ndash; The target projects name in Directus.
 - ```targetStatuses: string[] | void``` &ndash; **Default:** ```["published", "__NONE__"]``` &ndash; A set of allowed statuses records must match to be included in the mesh. A value of ```null``` or ```undefined``` includes content of any status. The string ```"__NONE__"``` can be used to allow records with no status defined.
 - ```typePrefix: string``` &ndash; **Default:** ```"Directus"``` &ndash; The prefix to use for the node types exposed in the GraphQL layer.
 - ```includeJunctions: boolean``` &ndash; **Default:** ```false``` &ndash; Allows inclusion of the junction tables that manage M2M relations in the GraphQL layer.
 - ```downloadFiles: boolean``` &ndash; **Default:** ```true``` &ndash; Indicates if files should be downloaded to disk. Enables images to be used with other transform plugins. Setting to false could be useful if the project has many files.
 - ```customRecordFilter: (record: any, collection: string) => boolean``` &ndash; A function executed for each record, returning whether the record should be included in the content mesh. **Note:** If provided, this will **override** any ```targetStatuses``` value.

### Example Configuration

```js
// gatsby-config.js

module.exports = {
    // ...
    plugins: [
        {
            // ...
                resolve: 'gatsby-source-directus-cms',
                options: {
                    url: 'https://directus.example.com',
                    project: '_',
                    email: 'admin@example.com',
                    password: 'example',
                    targetStatuses:['published', 'draft', '__NONE__'],
                    downloadFiles: false,
                },
            // ...
        }
    ]
    // ...
}
```

## Notes

### Directus Config

Setting up a separate user in Directus for usage with this plugin is recommended. Make sure you grant ```read``` privileges to the user on all tables, including system tables. See more in the [Directus docs](https://docs.directus.io/guides/permissions.html#collection-level).

### Development

The project is written in TypeScript. You can clone the repo and use the command ```npm run dev``` to start TypeScript in watch-mode. ```npm run build``` builds the project.
