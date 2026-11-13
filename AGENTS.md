# AGENTS.md

Guidance for coding agents working in this repository.

The first part (up to [Angular implementation](#angular-implementation)) is framework independent: it applies to any dwv based viewer. The second part describes the Angular specifics.

## Project overview

Medical (DICOM) viewer built on [DWV](https://github.com/ivmartel/dwv). Its layout and features are inspired by [dwv-simplistic](https://github.com/ivmartel/dwv-simplistic); look there for reference behaviour when adding features. Not certified for diagnostic use. License: GPL-3.0.

It is made of a reusable viewer component library and a demo application that consumes it. The library only exposes what consumers need. The dwv web workers are served by the app, not by the library.

Component behaviour and style are described in framework agnostic design specs (`projects/dwv-angular/doc/design/`). Read the spec before changing a component and keep it up to date with behaviour or style changes.

## Viewer requirements

- Several viewers must work on the same page:
  - each viewer owns its own dwv app and state, no global singletons for viewer state,
  - HTML element ids are built from a unique viewer id (e.g. `<viewerId>-layerGroup`),
  - DOM queries are done within the viewer root element rather than `document`,
  - dialogs are attached to their viewer context.
- Services keep their state private and expose it read only. The dwv service re-dispatches the dwv app events as `CustomEvent`s (it extends `EventTarget`).
- The UI follows Material Design guidelines; keep custom styling to a minimum.

## General conventions

- TypeScript is `strict`; do not loosen compiler or lint settings to make code pass.
- Formatting (see `.editorconfig`): 2-space indent, single quotes in TS, final newline, no trailing whitespace.
- Document classes, methods and non-obvious members with JSDoc comments (`/** ... */`), including `@param` and `@returns` for functions.
- Unit tests sit next to the code and run in jsdom (`canvas` package provides canvas support). jsdom lacks some browser APIs (e.g. `DragEvent`); build them from `Event` in a helper as done in `content.component.spec.ts`. Add or update tests when changing component or service behaviour.
- Package manager is Yarn 4 (via Corepack). Do not use npm to install or add dependencies, and do not edit `yarn.lock` by hand.
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
- Multiple viewers: `DwvComponent` provides its own `DwvAppService`, `AnnotationService` and `DWV_VIEWER_ID` (see `src/services/viewer-id.ts`). Do not use `providedIn: 'root'` for viewer state, build element ids from the injected `DWV_VIEWER_ID`, query the DOM from the component host `ElementRef`, and open dialogs that need viewer services with the viewer's `viewContainerRef`.
- Templates use the built-in control flow (`@if`, `@for ... track`), not `*ngIf` / `*ngFor`.
- UI components come from Angular Material / CDK; prefer Material components, theming and tokens over custom CSS.
- Library component class names are prefixed with `Dwv` (e.g. `DwvContentComponent`), selectors with `dwv-`.
- `strictTemplates` is enabled.

### Testing

- Unit tests use Vitest via `@angular/build:unit-test`.
- Spec files: `*.component.spec.ts`. Import test helpers explicitly from `vitest` (`describe`, `it`, `expect`, `vi`, `beforeEach`).
- Configure `TestBed` with `provideZonelessChangeDetection()`. Components tested outside `DwvComponent` need the viewer providers (`DWV_VIEWER_ID`, services) in `TestBed`.
