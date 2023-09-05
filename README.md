# rdAPI

> Prototype of record download API

## Installation

Clone from git and run `npm ci`.

For deployment with pm2 copy `ecosystem.example.json` to `ecosystem.config.json` and run `pm2 install ecosystem.config.json`.

## Configuration

Environment variables and/or a local `.env` file can be used to configure:

* `PORT` which port to under (default: 7665)
* `UNAPI` unAPI endpoint to use (default: <https://unapi.k10plus.de/>)
* `FORMATS` URL of a JSON file with an object of supported formats. Formats with dot in its name are removed (default: <https://kxpapiwww.k10plus.de/unapi/formats>)
* `DEBUG` enable logging
* `SMTP` SMTP connection in the form `username@host` or `username@host:port` to support sending records by email
* `PASS` Corresponding email password

The local file `formats.js` further adds information about formats (this will likely be changed).

## API

There is an API endpoint for each database, with optional flags just like SRU (e.g. `/opac-de-627`, `/opac-de-627!levels=0` ...) followed by a dot and a format id from unAPI. A GET or POST request is expected to provide the following parameters:

- `id`: list of PPNs, separated by any of spaces, newlines, comma, `|`
- `download`: download result as given filename
- `sep`: optional string to join records (empty line as default). Treated as boolean for JSON-based formats to return newline-delimited JSON instead of JSON array
- `email`: optional email address to send result to (*not fully implemented yet*)

## Client

An info page with a demo client in JavaScript is shown at the server root.

