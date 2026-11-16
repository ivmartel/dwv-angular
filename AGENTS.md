# AGENTS.md

Guidance for coding agents working in this repository.

## Project overview

Medical (DICOM) image viewer Angular component built on [DWV](https://github.com/ivmartel/dwv), shipped with a demo application. Not certified for diagnostic use. License: GPL-3.0.

The main deliverable is the reusable viewer component library; the demo application consumes it and shows how to integrate it. The library only exposes what consumers need.

## Requirements

- Viewer inputs:
  - `uri` (string, watched): URI with search arguments describing the data to load
    (for ex. `https://www.demo.com/index.html?input=file.dcm`, see the dwv
    `App.loadFromUri` method),
  - `urls` (string[], watched): urls of the data to load,
  - `loadFromWindowLocation` (boolean, default false): use the window
    location as input URI if it has search arguments,
  - `showLegend` (boolean, default false): show the footer legend
    ("Powered by" dwv and Angular, with their versions).

  The data inputs are checked in order `uri`, `urls`, then
  `loadFromWindowLocation`; the first one that is set is used.
- Toolbar: load progress, the dwv tools (scroll, zoom and pan, window level
  with presets, draw with shapes), reset, orientation toggle and DICOM tags
  dialog. Tools are disabled until data is loaded and when they cannot run
  on it (for ex. window level on colour images).
- Image window: renders the loaded data with dwv and its overlays; data is
  loaded from the viewer inputs, or by drag and drop or file selection
  (local files) through a drop box shown while no data is loaded. It refits when its size changes (for ex. when
  the right panel opens, closes or is resized).
- Annotation list: in the right panel, lists the annotation groups and their
  annotations and lets the user navigate to, inspect and edit them, and save
  a group as DICOM SR. It only displays the annotation state, every action
  goes through the annotation service.
- Several viewers must work on the same page:
  - each viewer owns its own dwv app and state, no global singletons for
    viewer state,
  - HTML element ids are built from a unique viewer id
    (e.g. `<viewerId>-layerGroup`),
  - DOM queries are done within the viewer root element rather than
    `document`,
  - dialogs are attached to their viewer context.

## Design specs

Component behaviour and style are described in framework-agnostic design
specs (`projects/dwv-angular/doc/design/`: purpose, placement, data, structure,
actions, accessibility). Read the spec before changing a component and update
it in the same change; add one for any significant new component. The viewer is
modelled on [dwv-simplistic](https://github.com/ivmartel/dwv-simplistic);
some modules are ports of it (see the notes at the top of files and the
specs): keep their behaviour aligned unless the spec says otherwise, and
look there for reference behaviour when adding features.

## Architecture

- **Services hold the logic, components display state.**
  `DwvComponent` (`dwv-angular.component.ts`) creates one `DwvAppService`
  and one `AnnotationService` per viewer by listing them in its
  `providers`. Child components get them with `inject(...)`. Do not provide
  services in child components (or with `providedIn: 'root'`) and do not
  call the dwv `App` directly from components. Services keep their state in
  private signals and expose it read only (`asReadonly()`): components never
  mutate it (for ex. the plain data annotation `state` of
  `AnnotationService`), every change goes through a service method.
- Services extend `EventTarget` and notify events with `CustomEvent`s
  (`DwvAppService` re-dispatches the dwv app events and adds its own,
  `AnnotationService` dispatches `error`); components add their listeners in
  the constructor and remove them in `inject(DestroyRef).onDestroy(...)`.
- `DwvComponent` creates the viewer id with `provideViewerId()`
  (`services/viewer-id.ts`, ids `dwv-0`, `dwv-1`...) and provides it as the
  `DWV_VIEWER_ID` token; `DwvAppService` and components get it with
  `inject(DWV_VIEWER_ID)`, without a fallback: components are always created
  inside a `DwvComponent`. Element ids are `<viewerId>-<name>`, never
  hard-coded. Only add an id when something references it
  (`getElementById`, `<label for>`, `aria-controls`, dwv's layer group...).

## General conventions

- TypeScript is `strict`; do not loosen compiler or lint settings to make code pass.
- Formatting (see `.editorconfig`): 2-space indent, single quotes in TS, final newline, no trailing whitespace.
- Document classes, methods and non-obvious members with JSDoc comments (`/** ... */`), including `@param` and `@returns` for functions.
- Unit tests sit next to the code and run in jsdom (`canvas` package provides canvas support). jsdom lacks some browser APIs (e.g. `DragEvent`); build them from `Event` in a helper as done in `content.component.spec.ts`. Add or update tests when changing component or service behaviour.
- Package manager is Yarn 4 (via Corepack). Do not use npm to install or add dependencies, and do not edit `yarn.lock` by hand.
- The dwv web workers are served by the app, not by the library.
- Do not patch dwv (no edits in `node_modules/dwv`, no `patch-package` or Yarn patches, no monkey-patching at runtime). If a fix or feature is needed in dwv itself, propose a pull request to the [dwv repository](https://github.com/ivmartel/dwv) instead.

## Commits and PRs

- Short imperative commit subjects (e.g. `Add right panel`, `Make the service an EventTarget`). Reference issues with `fixes #<number>` when relevant.
- Keep changes focused; avoid unrelated refactors or dependency bumps (Dependabot handles those).
- CI (`.github/workflows/nodejs-ci.yml`) runs, in order: `yarn install --immutable`, `lint`, `build-lib`, `test-ci`, then the app build. Run the same steps locally before considering a change done.
- Pushes to `main` deploy the demo to GitHub Pages, so `main` must always build and pass tests.

## Angular implementation

### Workspace

Angular CLI workspace with two projects:

- `projects/dwv-angular`: the library (`<dwv-angular>` component, selector prefix `dwv`).
  - `src/lib/`: standalone components (header, content, footer, right panel, annotation list, tags dialog/table) and helpers (`quantification.ts`, `shape-icons.ts`).
  - `src/services/`: `DwvAppService` (wraps the dwv `App`, exposes state as signals and re-dispatches app events), `AnnotationService`, viewer id token (`viewer-id.ts`), overlay config.
  - `src/public-api.ts`: public entry point of the library.
  - `doc/design/`: the component design specs.
- `projects/dwv-angular-app`: demo application (selector prefix `app`).

The app imports `dwv-angular` through a `tsconfig.json` path mapping to `dist/dwv-angular`, so **the library must be built before serving, building or testing the app**.

dwv web workers are copied from `node_modules/dwv/dist/assets` to `/assets` in the app build (see `angular.json`).

### Commands

```sh
yarn install           # install dependencies
yarn run build-lib     # build the library (required before app build/serve/test)
yarn run watch-lib     # rebuild the library on change (development config)
yarn run start         # serve the demo app at http://localhost:4200
yarn run lint          # lint all projects
yarn run test-ci       # run all unit tests once, with coverage
yarn run test dwv-angular   # tests for one project, in watch mode
```

### Code conventions

- Angular 22, **zoneless** change detection (`provideZonelessChangeDetection`). Do not add `zone.js`; rely on signals for reactivity.
- Standalone components only (no NgModules), with `imports` in the `@Component` decorator and separate `templateUrl` / `styleUrls` files (`.html`, `.scss`).
- Use `inject()` rather than constructor injection.
- State: prefer signals. In services, keep a private writable signal and expose a readonly one:
  ```ts
  readonly #dataReady = signal(false);
  readonly dataReady = this.#dataReady.asReadonly();
  ```
- Use ES private fields (`#field`) for private service members.
- Multiple viewers (see [Architecture](#architecture)): query the DOM from the component host `ElementRef`, and open dialogs that need viewer services with the viewer's `viewContainerRef`.
- Templates use the built-in control flow (`@if`, `@for ... track`), not `*ngIf` / `*ngFor`.
- UI components come from Angular Material / CDK; prefer Material components, theming and tokens over custom CSS.
- Library component class names are prefixed with `Dwv` (e.g. `DwvContentComponent`), selectors with `dwv-`.
- `strictTemplates` is enabled.
- The UI follows Material Design guidelines; keep custom styling to a minimum.

### Testing

- Unit tests use Vitest via `@angular/build:unit-test`.
- Spec files: `*.component.spec.ts`. Import test helpers explicitly from `vitest` (`describe`, `it`, `expect`, `vi`, `beforeEach`).
- Configure `TestBed` with `provideZonelessChangeDetection()`. Components tested outside `DwvComponent` need the viewer providers (`DWV_VIEWER_ID`, services) in `TestBed`.
