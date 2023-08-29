# rdAPI

> Prototype of record download API

## API

There is an API endpoint for each database, with optional flags just like SRU (e.g. `/opac-de-627`, `/opac-de-627!levels=0` ...). A GET or POST request is expected to provide the following parameters:

- `format`: format id from unAPI
- `ids`: list of PPNs, separated by any of spaces, newlines, comma, `|`
- `method`: one of "print" (default) "download" and "email" (*not implemented yet*)
- `mailto`: email address when method=email (*not implemented yet*)
- `delim`: optional string to join records (empty line as default)

## How does it work?

1. fetch all records via/like unAPI
2. Depending on format type:

   - if format type is `application/json`: concatenate with newline if record delimiter set or wrap as JSON array (otherwise)
   - if format type is `application/xml`: concatenate with newlines or use specified record separator as new XML root element to combine XML
   - if format type is `text/plain` or other: concatenate with record delimiter
