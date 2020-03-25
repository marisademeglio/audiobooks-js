# Audiobooks-js API

Get started:

```
import { Manifest } from 'audiobooks.js';
let manifest = new Manifest();
manifest.setSupportedProfiles({
    id: "https://www.w3.org/TR/audiobooks/",
    encodingFormats: ['audio/mpeg']});
manifest.setDefaults({ direction: "ltr" });
manifest.loadUrl("myfile.json");

// access the following properties/methods on manifest, e.g.
console.log("Base URL: ", manifest.data.base);
```

Caveat: There is a dependency on [`moment.js`](https://momentjs.com) so include it in your HTML file, e.g. 

```
<script src="../lib/moment.js"></script>
<script src="../lib/audiobooks.js"></script>
```

## Properties

### `data`

Contains the processed manifest data. Also includes these properties:

* `profile`: conformant profile, either declared in `conformsTo` or guessed
* `toc` (audiobooks only): `true/false` if an HTML resource containing `[role=doc-toc]` is present
* `base`: base URL

Reading order items have two `url` properties:

* `url`: the absolute URL of the resource
* `originalUrl`: the original URL as appears in the manifest document. May be relative. Useful for storing references to the reading order entry in order to maintain them even if the publication itself moves locations (e.g. someone starts localhost:8181 instead of :8080 -- all the bookmarks should not break)

### `errors`

Array of errors. Each error looks like this:

```
{severity: 'validation', msg: 'Missing property "xyz"'}
```

Error severities are: `fatal`, `validation`


## Methods

### `loadUrl(url, guessProfile)`

Load a manifest from a URL.

`url`: `URL Object` or `string`. The address of the file to load

`guessProfile`: `boolean`. Whether the manifest parser should try to determine the profile of a publication if `conformsTo` is missing.

### `loadJson(json, base, guessProfile)`

Load a manifest from JSON.

* `json` (JSON): Manifest data
* `base` (string): Base URL for this manifest.
* `guessProfile` (boolean): Whether the manifest parser should try to determine the profile of a publication if `conformsTo` is missing.

### `setSupportedProfiles(profiles)`

Describe the profiles supported. 

_Call before calling `loadUrl` or `loadJson`_

`profiles` (Array of objects): List of profiles supported by the user agent

The manifest parser will use these profile descriptions to match a profile to a publication, if `conformsTo` is missing.

### setDefaults(defaults)

Set default values for language, direction, and title.

_Call before calling `loadUrl` or `loadJson`_

`defaults` (Object): Contains 0 or 1 of each of the properties `lang`, `dir`, and `title`.

Example:
```
manifest.setDefaults({
    lang: 'en',
    dir: 'ltr', 
    title: 'Becoming'
});
```

`dir` and `lang` are global defaults. `title` is for when there is no `name` property in the manifest, e.g. a single document publication that relies on the HTML `<title>` element.

### getTitle()

Returns a string for the title. If there is more than one option, it decides based on language settings.

### getCover()

Returns the `LinkedResource` for the cover.

### getPageList()

Returns the `LinkedResource` for the page list.

### hasHtmlToc()

Returns `true` or `false` depending on whether there is an HTML resource with `rel: 'contents'`

### getToc()

Returns either the `LinkedResource` data for the HTML table of contents, or if none is present, a JSON object listing the URLs and names in the reading order items. The name strings will have been resolved against language settings.

### Reading order functions

* `getCurrentReadingOrderItem()`
* `gotoNextReadingOrderItem()`
* `gotoPrevReadingOrderItem()`

All return a `LinkedResource`, or `null`.

### updateCurrReadingOrderItem(url)

`url` (string): URL of the item to go to

Update the reading order position based on the value of `url`. Returns corresponding `LinkedResource`.
