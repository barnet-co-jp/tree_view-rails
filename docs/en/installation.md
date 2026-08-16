# Installation

This page explains how to install `tree_view` in a Rails host app.

## Requirements

- Ruby 3.2 or later
- Rails 7.0 or later

These requirements should stay aligned with `required_ruby_version` and the `railties` dependency in `tree_view.gemspec`.

## CI coverage

GitHub Actions runs the following checks on pull requests:

- Ruby lint through `bundle exec standardrb`
- Ruby specs through `bundle exec rspec`
- Representative Rails compatibility checks through `gemfiles/rails_7_0.gemfile`, `gemfiles/rails_7_2.gemfile`, and `gemfiles/rails_8_0.gemfile`; docs-only pull requests keep the check names but skip the heavy Rails lanes
- JavaScript checks through the changed-files policy:
  - README, `docs/**`, and `CHANGELOG.md` changes run `npm ci` and `npm run test:docs-entrypoints`
  - `docs/mockups/**` and `test/browser/**` changes install Playwright and run `npm run test:browser`
  - non-docs pull requests run `npm run test:js:core`
- Package-sensitive paths, including README, `CHANGELOG.md`, `docs/**`, runtime files, manifest files, and package metadata, run the `gem_package` job

Pushes to `main` keep the heavier compatibility and release checks:

- Ruby version matrix
- Full Rails version matrix
- JavaScript tests through `npm ci`, `npm run test:js:core`, and browser smoke when the workflow runs outside the pull request docs-only shortcut
- gem package verification

The repository keeps a committed `package-lock.json`. CI and local setup use `npm ci` so JavaScript checks install from the lockfile rather than updating dependency resolution during verification.

Release tags should be placed only on `main` commits whose full CI has passed.

## Gemfile

Add the gem to the host app's `Gemfile`.

For a published release, use the ordinary RubyGems install path:

```ruby
gem "tree_view"
```

When you need unreleased `main` changes, use the GitHub source explicitly:

```ruby
gem "tree_view", git: "https://github.com/barnet-co-jp/tree_view-rails.git"
```

Then run `bundle install` as usual.

```bash
bundle install
```

## CSS import

TreeView ships `app/assets/stylesheets/tree_view.css` as plain CSS. In Rails 8 + Propshaft apps, prefer loading the logical asset directly from the layout without assuming a Sass compilation step.

```erb
<%= stylesheet_link_tag "tree_view", "data-turbo-track": "reload" %>
```

For host apps that explicitly use Sass or cssbundling, TreeView also ships `tree_view.scss` with the same contents for compatibility. Those apps can keep the traditional import path.

```scss
@import "tree_view";
```

The packaged stylesheet is a quick-start baseline for TreeView's reusable structure and lightweight state cues. It covers common row states such as selected, current, collapsed, loading, error, and drop target rows, but the final theme, density, brand colors, and product wording remain host-app responsibilities.

When the host app needs a different visual language, override the documented row, toggle, and table selectors after the TreeView stylesheet. For the packaged stylesheet's small documented CSS custom property surface, see [Styling state cues](styling-state-cues.md).

## JavaScript / importmap

Add the TreeView importmap pin when the JavaScript controllers are needed.

```ruby
pin "tree_view", to: "tree_view/index.js"
```

For importmap apps that already boot a Stimulus application, register the bundled controllers from the host app's JavaScript entrypoint:

```js
import { application } from "controllers/application"
import { registerTreeViewControllers } from "tree_view"

registerTreeViewControllers(application)
```

Static rendering works without dedicated TreeView JavaScript. JavaScript controllers are used for browser-side integration hooks such as state tracking, keyboard navigation, selection cascade, transfer events, and remote loading state.

## JavaScript / Vite + TypeScript

v1.0.1 ships `app/javascript/tree_view/package.json` in the gem so the package root resolves `index.js` and `index.d.ts` through the same entrypoint. In Vite, alias `tree_view` to the gem's `app/javascript/tree_view` **directory**. Do not alias directly to the physical `index.js` file, because that bypasses package metadata and declaration resolution.

```ts
// vite.config.ts
import { execFileSync } from "node:child_process"
import path from "node:path"
import { defineConfig } from "vite"

const treeViewRoot = path.join(
  execFileSync("bundle", ["show", "tree_view"], { encoding: "utf8" }).trim(),
  "app/javascript/tree_view"
)

export default defineConfig({
  resolve: {
    alias: {
      tree_view: treeViewRoot
    }
  }
})
```

Application code then uses the same public import as importmap apps:

```ts
import { registerTreeViewControllers } from "tree_view"
```

The package-local `types` / `exports` metadata points at the bundled `index.d.ts`. Vite-aware build/transpile tooling can resolve the package root from the alias. If a host app also runs standalone `tsc`, configure TypeScript's own module resolution, such as `compilerOptions.paths`, to resolve `tree_view` to the same directory. Avoid replacing TreeView's declarations with a handwritten `declare module "tree_view"`, because that hides the richer type surface shipped by the gem.

Use `registerTreeViewControllers(application)` as the quick-start path for JavaScript-powered TreeView features. Host apps that need selective registration or a custom boot order can use `TreeViewControllerIdentifiers` from the public JavaScript surface; see [Public API](public-api.md#javascript-surface).

## Persisted-state setup generator

When the host app enables persisted expansion state, run the persisted-state install generator after the gem is installed:

```bash
bin/rails generate tree_view:state:install
```

Pass an owner model name when the generated concern should be included in an existing owner model:

```bash
bin/rails generate tree_view:state:install User
```

The generator name, optional owner argument, and generated destination paths are documented as the [Public Setup Surface](public-setup-surface.md). That path-level contract tracks `db/migrate/*_create_tree_view_states.rb`, `app/models/tree_view_state.rb`, and `app/models/concerns/tree_view_state_owner.rb` without freezing the migration schema or generated template contents. Review the generated files in the host app, then continue with [Persisted State](persisted-state.md) for storage ownership, authorization, save timing, cleanup policy, controller actions, and UI wiring boundaries.

## Packaged files

The gem package should include the files needed by Rails host apps:

- `app/assets/stylesheets/tree_view.css`
- `app/assets/stylesheets/tree_view.scss`
- `app/helpers/tree_view_helper.rb`
- `app/helpers/tree_view_helper/**/*`
- `app/javascript/tree_view/index.js`
- `app/javascript/tree_view/index.d.ts`
- `app/javascript/tree_view/package.json`
- `app/javascript/tree_view/**/*`
- `app/views/tree_view/**/*`
- `config/importmap.tree_view.rb`
- `config/locales/**/*`
- `config/public_api_manifest.yml`
- `lib/**/*`
- `README.md`
- `CHANGELOG.md`
- `docs/**/*`

`config/public_api_manifest.yml` is packaged as a machine-readable audit artifact for the documented public surface. Host apps do not need to load it at runtime to render TreeView.

When installation behavior changes, keep this list aligned with the packaged file list in `tree_view.gemspec` and package verification.

## Propshaft

For Rails 8 + Propshaft, prefer loading the packaged plain CSS asset directly by logical asset name.

```erb
<%= stylesheet_link_tag "tree_view", "data-turbo-track": "reload" %>
```

Do not rely on Propshaft itself to compile Sass. Only host apps that explicitly use Sass or cssbundling should import the compatibility `tree_view.scss` through that pipeline.

For JavaScript with importmap, the existing pin remains available:

```ruby
pin "tree_view", to: "tree_view/index.js"
```

For Vite, use the package-root alias described above.

## Sprockets

The engine keeps Sprockets-compatible asset hooks.

- Add `app/javascript` to asset paths
- Add `tree_view.css` and `tree_view/index.js` to precompile targets

The `tree_view.scss` compatibility source remains available for existing host apps with a Sass pipeline.

## Asset / importmap audit checklist

When asset or JavaScript paths change, check these items before release:

- `tree_view.gemspec` includes plain CSS, the SCSS compatibility source, JavaScript, type declarations, package metadata, and importmap files
- README installation examples do not contradict this file
- the package checklist in `docs/en/release.md` is updated
- static rendering still works without JavaScript
- JavaScript-dependent features document the required importmap pin or Vite alias and data attributes

## Development setup

For local Ruby:

```bash
bundle install
bundle exec standardrb
bundle exec rspec
bundle exec rake build
npm ci
npm run test:js
```

Use `npm ci` here for the same reason as CI: the committed `package-lock.json` is the repeatable install source.

Rails compatibility Gemfiles live under `gemfiles/`.

```bash
BUNDLE_GEMFILE=gemfiles/rails_7_0.gemfile bundle install
BUNDLE_GEMFILE=gemfiles/rails_7_0.gemfile bundle exec rake
```

For Docker:

```bash
cp .env.example .env
docker compose build
docker compose run --rm app bundle install
docker compose run --rm app bundle exec rspec
docker compose run --rm app bundle exec rake build
```

Use `.devcontainer/devcontainer.json` for VS Code Dev Containers.

## CI

GitHub Actions runs the following on pull requests:

- `bundle exec standardrb`
- `bundle exec rspec`
- representative Rails compatibility checks through `gemfiles/rails_7_0.gemfile`, `gemfiles/rails_7_2.gemfile`, and `gemfiles/rails_8_0.gemfile`
- JavaScript checks selected by changed files
- gem package verification for package-sensitive paths

On pushes to `main`, GitHub Actions runs the Ruby version matrix, full Rails version matrix, JavaScript tests, and gem package verification.
