# AGENTS.md

Guidance for coding agents working in this repository.

## Project overview

Medical (DICOM) viewer built on [DWV](https://github.com/ivmartel/dwv) and Angular. Its layout and features are inspired by the dwv development viewer ([`dev/viewer`](https://github.com/ivmartel/dwv/tree/develop/dev/viewer) in the dwv repository); look there for reference behaviour when adding features. Not certified for diagnostic
use. License: GPL-3.0.

It is an Angular CLI workspace with two projects:

- `projects/dwv-angular`: the reusable Angular library (`<dwv-angular>` component, selector prefix `dwv`).
  - `src/lib/`: standalone components (header, content, footer, right panel, annotation list, tags dialog/table) and helpers (`quantification.ts`, `shape-icons.ts`).
  - `src/services/`: `DwvAppService` (wraps the dwv `App`, exposes state as signals and re-dispatches app events as `CustomEvent`s, since it extends `EventTarget`), `AnnotationService`, overlay config.
  - `src/public-api.ts`: public entry point of the library. Only export what consumers need.
  - `doc/design/`: component design specs, framework agnostic. Read the spec before changing a component and keep it up to date with behaviour or style changes.
- `projects/dwv-angular-app`: demo application that consumes the library (selector prefix `app`).

The app imports `dwv-angular` through a `tsconfig.json` path mapping to `dist/dwv-angular`, so **the library must be built before serving, building or testing the app**.

dwv web workers are copied from `node_modules/dwv/dist/assets` to `/assets` in the app build (see `angular.json`), not in the library.

## Setup and commands

Package manager is Yarn 4 (via Corepack). Do not use npm to install or add dependencies, and do not edit `yarn.lock` by hand.

```sh
yarn install           # install dependencies
yarn run build-lib     # build the library (required before app build/serve/test)
yarn run watch-lib     # rebuild the library on change (development config)
yarn run start         # serve the demo app at http://localhost:4200
yarn run lint          # lint all projects
yarn run test-ci       # run all unit tests once, with coverage
yarn run test dwv-angular   # tests for one project, in watch mode
```

CI (`.github/workflows/nodejs-ci.yml`) runs, in order: `yarn install --immutable`, `lint`, `build-lib`, `test-ci`, then the app build. Run the same steps locally before considering a change done.

## Code conventions

- Angular 22, **zoneless** change detection (`provideZonelessChangeDetection`). Do not add `zone.js`; rely on signals for reactivity.
- Standalone components only (no NgModules), with `imports` in the `@Component` decorator and separate `templateUrl` / `styleUrls` files (`.html`, `.scss`).
- Use `inject()` rather than constructor injection.
- State: prefer signals. In services, keep a private writable signal and expose a readonly one:
  ```ts
  readonly #dataReady = signal(false);
  readonly dataReady = this.#dataReady.asReadonly();
  ```
- Use ES private fields (`#field`) for private service members.
- Templates use the built-in control flow (`@if`, `@for ... track`), not `*ngIf` / `*ngFor`.
- UI components come from Angular Material / CDK. Keep custom styling to a minimum and follow Material Design guidelines; prefer Material components, theming and tokens over custom CSS.
- Library component class names are prefixed with `Dwv` (e.g. `DwvContentComponent`), selectors with `dwv-`.
- Formatting (see `.editorconfig`): 2-space indent, single quotes in TS, final newline, no trailing whitespace.
- Document classes, methods and non-obvious members with JSDoc comments (`/** ... */`), including `@param` and `@returns` for functions.
- TypeScript is `strict` with `strictTemplates`; do not loosen compiler or lint settings to make code pass.

## Testing

- Unit tests use Vitest via `@angular/build:unit-test`, running in jsdom (`canvas` package provides canvas support).
- Spec files sit next to the code: `*.component.spec.ts`. Import test helpers explicitly from `vitest` (`describe`, `it`, `expect`, `vi`, `beforeEach`).
- Configure `TestBed` with `provideZonelessChangeDetection()`.
- jsdom lacks some browser APIs (e.g. `DragEvent`); build them from `Event` in a helper as done in `content.component.spec.ts`.
- Add or update tests when changing component or service behaviour.

## Commits and PRs

- Short imperative commit subjects (e.g. `Add right panel`, `Make the service an EventTarget`). Reference issues with `fixes #<number>` when relevant.
- Keep changes focused; avoid unrelated refactors or dependency bumps (Dependabot handles those).
- Pushes to `main` deploy the demo to GitHub Pages, so `main` must always build and pass tests.

## Notes

- Do not patch dwv (no edits in `node_modules/dwv`, no `patch-package` or Yarn patches, no monkey-patching at runtime). If a fix or feature is needed in dwv itself, propose a pull request to the [dwv repository](https://github.com/ivmartel/dwv) instead.

