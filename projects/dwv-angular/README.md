# dwv-angular

Medical viewer [Angular](https://angular.io/) component using [DWV](https://github.com/ivmartel/dwv) (DICOM Web Viewer).

All coding/implementation contributions and comments are welcome.

dwv-angular is not certified for diagnostic use. Released under GNU GPL-3.0 license (see [license.txt](../../license.txt)).

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `uri` | `string` | - | URI with search arguments describing the data to load, for example `https://www.demo.com/index.html?input=file.dcm` (see the dwv `getURLsFromKeyValueUri` function). |
| `urls` | `string` | - | White space separated urls of the data to load. |
| `loadFromWindowLocation` | `boolean` | `false` | Use the window location as input URI if it contains search arguments. |
| `showLegend` | `boolean` | `false` | Show the footer legend ("Powered by" dwv and Angular, with their versions). |

The data inputs are checked in order: `uri`, `urls` then `loadFromWindowLocation`; the first one that is set is used. `uri` and `urls` are watched: when one changes to a new value, it is loaded on top of the existing data (`loadFromWindowLocation` is only read on init). If no data is loaded, a dropbox is shown to load data from the local system.

Examples:

```html
<!-- dropbox to load local data -->
<dwv-viewer [showLegend]="true"></dwv-viewer>

<!-- load from a URI -->
<dwv-viewer uri="https://www.demo.com/index.html?input=file.dcm"></dwv-viewer>

<!-- load a list of urls -->
<dwv-viewer
  urls="https://www.demo.com/file0.dcm https://www.demo.com/file1.dcm">
</dwv-viewer>

<!-- load from the page URL, for example http://localhost:4200/?input=file.dcm -->
<dwv-viewer [loadFromWindowLocation]="true"></dwv-viewer>
```

## Sizing

The `<dwv-viewer>` component fills its container (`height: 100%`): its parent element needs a definite height, otherwise the image view collapses. For example, for a full page viewer:

```css
html, body, app-root {
  height: 100%;
}
app-root {
  display: block;
}
```

The size can also be set directly on the element (`dwv-viewer { height: 600px; }`), or with `flex: 1` when it is inside a flex container.

## NPM
[![npm](https://img.shields.io/npm/v/dwv-angular.svg)](https://www.npmjs.com/package/dwv-angular)

Steps to publish:

```bash
# build (from the root of the repo)
yarn run build-lib

# move to build dir
cd dist/dwv-angular

# publish
npm publish
```
