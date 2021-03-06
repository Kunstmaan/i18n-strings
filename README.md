# Kunstmaan I18n-Strings

## Features
- [x] Lookup all translation keys inside your Xcode project.
- [x] Optimize build phase if there are missing translations.
- [x] Sync translations from a shared datastore

Example project integrating this in the Xcode build process can be found here [i18n-swift-example](https://github.com/Kunstmaan/i18n-swift-example)

## Installation

### [npm](https://www.npmjs.com/package/kuma-i18n-strings)

To install the kuma-i18n-strings cli command globally, you can run the following command:

```bash
$ npm install -g kuma-i18n-strings
```

### Syncing from Google Spreadsheets

#### Setting up a Google Service Account for syncing with Google Spreadsheets

This is a 2-legged oauth method and designed to be "an account that belongs to your application instead of to an individual end user".
Use this for an app that needs to access a set of documents that you have full access to.
([read more](https://developers.google.com/identity/protocols/OAuth2ServiceAccount))

__Setup Instructions__

1. Go to the [Google Developers Console](https://console.developers.google.com/project)
2. Select your project or create a new one (and then select it)
3. Enable the Drive API for your project
  - In the sidebar on the left, expand __APIs & auth__ > __APIs__
  - Search for "drive"
  - Click on "Drive API"
  - click the blue "Enable API" button
4. Create a service account for your project
  - In the sidebar on the left, expand __APIs & auth__ > __Credentials__
  - Click blue "Add credentials" button
  - Select the "Service account" option
  - Select the "JSON" key type option
  - Click blue "Create" button
  - your JSON key file is generated and downloaded to your machine (__it is the only copy!__)
  - note your service account's email address (also available in the JSON key file)
5. Share the doc (or docs) with your service account using the email noted above
6. Create a .kuma-i18n-strings configuration file that looks as follows:

```json
{
  "sync": {
    "provider": "google",
    "config": {
	    "file-id": "<the id of the google spreadsheet>",
	    "columns": {
	      "key": "< the name of the column where the key can be found>",
	      "value": ["<the column names that are used for the translation values>"]
	    },
	    "creds": {
	      "": "The JSON key file that is generated by setting up a service account in Google"
	    }
	 }
  }
}

```

For more information about setting up a Service Account look at the [google-spreadsheet npm package](https://github.com/theoephraim/node-google-spreadsheet)

Multiple values are possible for the column names where the values can be found. This way you can use the translation file for multiple platforms. The array should contain the column names sorted by importance. If there is no value found in the first column it will fall back to the next and so on ...

In the column names for the values you can specify the language by adding ```$$LANG$$``` this will be replaced by the actual language. For example: ```ios fallback $$LANG$$``` will become ```ios fallback en```.

### Syncing from an endpoint that returns strings files

```json
{
  "sync": {
    "provider": "url",
    "config": {
      "url": "https://some.remote.end/point/$$LANG$$.strings",
	    "format": "strings"
	 }
  }
}
```

Currently only endpoints returning strings files are supported.

## Usage

To collect all the strings from the storyboard, swift files:

```bash
$ kuma-i18n-strings collect
```

To sync the translations with an online datastore (for now only google spreadsheets):

```bash
$ kuma-i18n-strings sync
```

### Options
```bash
-s, --source         Specify the path where the Xcode files are located
-c, --config         Specify the path to the kuma-i18n configuration file relative to the source path, default .kuma-i18n-strings
-u, --update-files   Specify if it may update the Localizable files, default false
-h, --help           Display help
-v, --version        Display the current version number
```

When you are using the above commands without ```-u``` or ```--update-files``` it will exit with an exit code of -1 when there are new translations in the online datastore or in the xcode project. This way you can integrate it within your build phases so that building fails when the translations aren't up-to-date.

## Roadmap

* Add Android support, especially for syncing
