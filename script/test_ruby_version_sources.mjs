import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

const minimumRubyVersion = "3.2";
const currentRubyVersion = "3.3";
const expectedReadmeSignal = `Ruby ${minimumRubyVersion} or later`;

const readme = read("README.md");
const gemspec = read("tree_view.gemspec");
const workflow = read(".github/workflows/ci.yml");
const dockerfile = read("Dockerfile");
const englishDevelopment = read("docs/en/development.md");
const japaneseDevelopment = read("docs/ja/development.md");
const englishRelease = read("docs/en/release.md");
const japaneseRelease = read("docs/ja/release.md");
const packageJson = JSON.parse(read("package.json"));

function assertIncludes(content, signal, path) {
  assert.ok(content.includes(signal), `${path} must include ${JSON.stringify(signal)}`);
}

assertIncludes(readme, expectedReadmeSignal, "README.md");
assert.match(
  gemspec,
  /spec\.required_ruby_version\s*=\s*["']>= 3\.2["']/,
  "tree_view.gemspec must keep required_ruby_version aligned with the README minimum Ruby version"
);

assertIncludes(workflow, 'ruby-version: "3.2"', ".github/workflows/ci.yml");
assertIncludes(workflow, 'ruby-version: "3.3"', ".github/workflows/ci.yml");
assertIncludes(workflow, '- "3.2"', ".github/workflows/ci.yml");
assertIncludes(workflow, '- "3.3"', ".github/workflows/ci.yml");
assertIncludes(workflow, "ruby_matrix:", ".github/workflows/ci.yml");
assertIncludes(workflow, "rails_matrix:", ".github/workflows/ci.yml");
[
  '- rails: "7.1"',
  "gemfile: gemfiles/rails_7_1.gemfile",
  'ruby-version: "3.2"'
].forEach((signal) => {
  assertIncludes(
    workflow,
    signal,
    ".github/workflows/ci.yml Rails 7.1 main-matrix signal"
  );
});

const dockerRubyBaseImage = dockerfile.match(/^FROM ruby:(?<version>\d+\.\d+(?:\.\d+)?)-slim$/m);
assert.ok(
  dockerRubyBaseImage,
  "Dockerfile must use a ruby:<major.minor[.patch]>-slim base image for development setup"
);
const [dockerRubyMajor, dockerRubyMinor] = dockerRubyBaseImage.groups.version.split(".");
assert.equal(
  `${dockerRubyMajor}.${dockerRubyMinor}`,
  minimumRubyVersion,
  `Dockerfile Ruby base image must stay on the minimum supported Ruby ${minimumRubyVersion}.x line for development setup; found ${dockerRubyBaseImage.groups.version}`
);

assert.equal(
  packageJson.scripts["test:ruby-version-sources"],
  "node script/test_ruby_version_sources.mjs",
  "package.json must expose the Ruby version source guard"
);
assert.ok(
  packageJson.scripts["test:entrypoints"].includes("npm run test:ruby-version-sources"),
  "npm run test:entrypoints must include the Ruby version source guard"
);

[
  [englishDevelopment, "docs/en/development.md"],
  [japaneseDevelopment, "docs/ja/development.md"]
].forEach(([content, path]) => {
  assertIncludes(content, "gemfiles/rails_7_0.gemfile", path);
  assertIncludes(content, "gemfiles/rails_7_1.gemfile", path);
  assertIncludes(content, "gemfiles/rails_7_2.gemfile", path);
  assertIncludes(content, "gemfiles/rails_8_0.gemfile", path);
  assertIncludes(content, "Ruby version matrix", path);
  assertIncludes(content, "Rails 7.1", `${path} Rails 7.1 main-matrix wording`);
});

[
  [
    englishRelease,
    "docs/en/release.md",
    [
      "npm run test:ruby-version-sources",
      "README.md",
      "tree_view.gemspec",
      "CI workflow",
      "Dockerfile Ruby base image",
      "Development docs",
      "package script",
      "representative Ruby version matrix",
      "does not change the supported Ruby policy by itself"
    ]
  ],
  [
    japaneseRelease,
    "docs/ja/release.md",
    [
      "npm run test:ruby-version-sources",
      "README.md",
      "tree_view.gemspec",
      "CI workflow",
      "Dockerfile の Ruby base image",
      "Development docs",
      "package script",
      "代表 Ruby version matrix",
      "supported Ruby policy を変更するものではありません"
    ]
  ]
].forEach(([content, path, signals]) => {
  signals.forEach((signal) => {
    assertIncludes(content, signal, `${path} Ruby version source release signal`);
  });
});

console.log(
  `Ruby version sources stay aligned with Ruby ${minimumRubyVersion}+ and representative Ruby ${minimumRubyVersion}/${currentRubyVersion} CI lanes, Rails 7.1 main-matrix coverage, bilingual release guidance, plus Docker Ruby ${dockerRubyBaseImage.groups.version}.`
);
