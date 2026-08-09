import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { classifyChangedFiles } from "./ci_changed_files_policy.mjs";

const workflowPath = ".github/workflows/ci.yml";
const packagePath = "package.json";
const policyCliPath = "script/ci_changed_files_policy.mjs";
const ciPolicySuitePath = "script/test_ci_policy_suite.mjs";
const ciPolicySuiteEntrypointExclusion = {
  path: ciPolicySuitePath,
  reason: "the suite self-test entrypoint is routed as CI policy-sensitive but is not a direct guard group"
};

const ciPolicyGuardScriptPaths = [
  "script/test_ci_changed_files_policy.mjs",
  "script/test_ci_public_contract_release_trail.mjs",
  "script/test_ci_workflow_changed_file_detection_signals.mjs",
  "script/test_ci_dependabot_maintenance_evidence_signals.mjs",
  "script/test_ci_matrix_boundary_signals.mjs",
  "script/test_ci_workflow_concurrency_signals.mjs",
  "script/test_ci_workflow_permissions_signals.mjs",
  "script/test_ci_policy_permissions_docs_signals.mjs",
  "script/test_ci_observation_guidance_signals.mjs",
  "script/test_ci_policy_docs_routing.mjs",
  "script/test_importmap_docs_entrypoint_routing.mjs",
  "script/test_package_lock_dependency_drift.mjs",
  "script/test_gemfile_lock_dependency_drift.mjs"
];

const cases = [
  {
    name: "gem-packaged docs stay docs-only and request package and docs entrypoint guards",
    files: ["README.md", "docs/en/development.md", "docs/ja/development.md", "CHANGELOG.md"],
    expected: {
      docs_only: true,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: true
    }
  },
  {
    name: "public API docs stay docs-only and request package and docs entrypoint guards",
    files: ["docs/en/public-api.md", "docs/ja/public-api.md"],
    expected: {
      docs_only: true,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: true
    }
  },
  {
    name: "mixed public API docs and runtime changes request full package and docs entrypoint guards",
    files: ["docs/en/public-api.md", "app/javascript/tree_view/index.js"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: true
    }
  },
  {
    name: "public setup and release docs stay docs-only and request package and docs entrypoint guards",
    files: ["docs/en/public-setup-surface.md", "docs/ja/release.md"],
    expected: {
      docs_only: true,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: true
    }
  },
  {
    name: "changelog-only docs request package and docs entrypoint guards",
    files: ["CHANGELOG.md"],
    expected: {
      docs_only: true,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: true
    }
  },
  {
    name: "repository profile docs stay docs-only without package, docs entrypoint, or CI policy guard",
    files: ["Product Profile.md"],
    expected: {
      docs_only: true,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: false,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: false
    }
  },
  {
    name: "AGENTS guidance stays docs-only but requests CI policy guard",
    files: ["AGENTS.md"],
    expected: {
      docs_only: true,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: false,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: false,
      ci_policy_sensitive: true
    }
  },
  {
    name: "mockup docs remain docs-only but request browser smoke and package guard",
    files: ["docs/mockups/default-tree.html"],
    expected: {
      docs_only: true,
      mockups_changed: true,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: true
    }
  },
  {
    name: "browser smoke tests are not docs-only and request browser smoke",
    files: ["test/browser/docs_mockups_smoke.spec.js"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: true,
      package_sensitive: false,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: false
    }
  },
  {
    name: "workflow changes are package-, Docker-, and CI policy-sensitive full CI changes",
    files: [".github/workflows/ci.yml"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: true,
      docs_entrypoint_sensitive: false,
      ci_policy_sensitive: true
    }
  },
  {
    name: "CI policy scripts request CI policy guard",
    files: ["script/ci_changed_files_policy.mjs", "script/test_ci_workflow_changed_file_detection_signals.mjs"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: false,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: false,
      ci_policy_sensitive: true
    }
  },
  {
    name: "CI workflow permissions signals request CI policy guard",
    files: ["script/test_ci_workflow_permissions_signals.mjs"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: false,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: false,
      ci_policy_sensitive: true
    }
  },
  {
    name: "Dependabot config changes are package- and CI policy-sensitive full CI changes without Docker setup",
    files: [".github/dependabot.yml"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: false,
      ci_policy_sensitive: true
    }
  },
  {
    name: "public manifest changes request full JS and docs entrypoint guards",
    files: ["config/public_api_manifest.yml"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: true
    }
  },
  {
    name: "package-sensitive runtime files are not docs-only",
    files: ["app/javascript/tree_view/index.js", "config/public_api_manifest.yml"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: true
    }
  },
  {
    name: "Ruby runtime files are package-sensitive full CI changes",
    files: ["lib/tree_view/engine.rb"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: false
    }
  },
  {
    name: "locale files are package-sensitive full CI changes",
    files: ["config/locales/en.yml"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: false
    }
  },
  {
    name: "Ruby dependency files are package-sensitive full CI changes",
    files: ["Gemfile", "Gemfile.lock"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: false
    }
  },
  {
    name: "release task wiring is package-sensitive without Docker setup verification",
    files: ["Rakefile"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: false,
      docs_entrypoint_sensitive: false
    }
  },
  {
    name: "package and Node metadata are package-sensitive full CI changes",
    files: ["package.json", "package-lock.json", ".nvmrc"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: true,
      docker_setup_sensitive: true,
      docs_entrypoint_sensitive: false
    }
  },
  {
    name: "Docker setup files request Docker setup verification",
    files: ["Dockerfile", "docker-compose.yml"],
    expected: {
      docs_only: false,
      mockups_changed: false,
      browser_smoke_changed: false,
      package_sensitive: false,
      docker_setup_sensitive: true,
      docs_entrypoint_sensitive: false
    }
  }
];

function workflowChangesOutputs(workflowSource) {
  const outputsBlock = workflowSource.match(/^  changes:\n(?:    .*\n)*?    outputs:\n(?<body>(?:      [a-z_]+: .*\n)+)/m);
  assert.ok(outputsBlock, `${workflowPath} must define jobs.changes.outputs`);

  return [...outputsBlock.groups.body.matchAll(/^      (?<key>[a-z_]+): /gm)].map((match) => match.groups.key).sort();
}

function workflowJobBlock(workflowSource, jobName) {
  const marker = `  ${jobName}:\n`;
  const start = workflowSource.indexOf(marker);
  assert.notEqual(start, -1, `${workflowPath} must define jobs.${jobName}`);

  const bodyStart = start + marker.length;
  const remainingWorkflow = workflowSource.slice(bodyStart);
  const nextJobOffset = remainingWorkflow.search(/\n  [a-z_]+:\n/);

  return nextJobOffset === -1 ? remainingWorkflow : remainingWorkflow.slice(0, nextJobOffset + 1);
}

function workflowJavaScriptJob(workflowSource) {
  return workflowJobBlock(workflowSource, "javascript");
}

function npmRunScripts(workflowSource) {
  return [...workflowJavaScriptJob(workflowSource).matchAll(/run: npm run (?<script>[\w:-]+)/g)]
    .map((match) => match.groups.script)
    .sort();
}

function escapeRegExp(value) {
  return String(value).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function workflowActionVersions(workflowSource, actionName) {
  const pattern = new RegExp(`uses: ${escapeRegExp(actionName)}@(?<version>[^\\s]+)`, "g");
  return [...new Set([...workflowSource.matchAll(pattern)].map((match) => match.groups.version))].sort();
}

function assertSameMembers(actual, expected, message) {
  assert.deepEqual([...actual].sort(), [...expected].sort(), message);
}

function assertWorkflowActionVersions(workflowSource, actionName, expectedVersions) {
  assertSameMembers(
    workflowActionVersions(workflowSource, actionName),
    expectedVersions,
    `${workflowPath} must use ${actionName}@${expectedVersions.join(" or ")} for its representative setup surface`
  );
}

function assertJobMatches(jobBlock, pattern, message) {
  assert.match(jobBlock, pattern, message);
}

function assertCiPolicyCommandRunsSuite(ciPolicyCommand, suiteArgs, message) {
  const escapedArgs = suiteArgs.map(escapeRegExp).join("\\s+");
  const argsPattern = escapedArgs.length > 0 ? `\\s+${escapedArgs}` : "";

  assert.match(
    ciPolicyCommand,
    new RegExp(`(?:^|&&\\s*)node ${escapeRegExp(ciPolicySuitePath)}${argsPattern}(?:\\s*&&|$)`),
    message
  );
}

function registeredCiPolicySuiteScriptPaths() {
  const suiteSource = readFileSync(ciPolicySuitePath, "utf8");

  return [
    ...new Set(
      [...suiteSource.matchAll(/args: \["(?<scriptPath>script\/[^\"]+\.mjs)"\]/g)]
        .map((match) => match.groups.scriptPath)
    )
  ].sort();
}

function assertCiPolicySuiteRegisteredScriptsAreRouted() {
  const missingRoutes = registeredCiPolicySuiteScriptPaths().filter(
    (scriptPath) => !classifyChangedFiles([scriptPath]).ci_policy_sensitive
  );

  assert.deepEqual(
    missingRoutes,
    [],
    [
      "CI policy suite registered guard scripts must be ci_policy_sensitive in script/ci_changed_files_policy.mjs:",
      ...missingRoutes.map((scriptPath) => `  - ${scriptPath}`),
      "Add each missing path to isCiPolicySensitivePath(...) so CI policy guard changes run npm run test:ci-policy."
    ].join("\n")
  );

  assert.equal(
    classifyChangedFiles([ciPolicySuiteEntrypointExclusion.path]).ci_policy_sensitive,
    true,
    `${ciPolicySuiteEntrypointExclusion.path} must stay ci_policy_sensitive because ${ciPolicySuiteEntrypointExclusion.reason}`
  );
}

function assertCiPolicySuiteRegistersGuardScripts() {
  const suiteSource = readFileSync(ciPolicySuitePath, "utf8");
  const registeredGuardScriptPaths = registeredCiPolicySuiteScriptPaths();

  assertSameMembers(
    registeredGuardScriptPaths,
    ciPolicyGuardScriptPaths,
    `${ciPolicySuitePath} checks array must match this test's CI policy guard script list`
  );

  for (const scriptPath of ciPolicyGuardScriptPaths) {
    assert.match(
      suiteSource,
      new RegExp(`args: \\["${escapeRegExp(scriptPath)}"\\]`),
      `${ciPolicySuitePath} checks array must register ${scriptPath} so test:ci-policy covers CI policy guard changes`
    );
  }

  assert.match(
    suiteSource,
    /assertCiPolicyScriptsRegistered\(\);/,
    `${ciPolicySuitePath} --self-test must keep its registration coverage check`
  );
}

function assertCiPolicyScriptRegistration(packageScripts) {
  const ciPolicyCommand = packageScripts["test:ci-policy"];
  assert.equal(
    typeof ciPolicyCommand,
    "string",
    `${packagePath} scripts.test:ci-policy must be a command string`
  );

  assertCiPolicyCommandRunsSuite(
    ciPolicyCommand,
    ["--self-test"],
    `${packagePath} scripts.test:ci-policy must run ${ciPolicySuitePath} --self-test before CI policy guards`
  );
  assertCiPolicyCommandRunsSuite(
    ciPolicyCommand,
    [],
    `${packagePath} scripts.test:ci-policy must run ${ciPolicySuitePath} so CI policy guard changes validate their own registration`
  );
  assertCiPolicySuiteRegistersGuardScripts();
  assertCiPolicySuiteRegisteredScriptsAreRouted();
}

function policyCliOutput(input) {
  return execFileSync(process.execPath, [policyCliPath], {
    input,
    encoding: "utf8"
  });
}

function parsePolicyCliOutput(output) {
  const result = {};

  for (const line of output.trim().split(/\r?\n/)) {
    assert.match(line, /^[a-z_]+=(true|false)$/, `${policyCliPath} must emit key=value boolean lines, got "${line}"`);
    const [key, value] = line.split("=");
    result[key] = value === "true";
  }

  return result;
}

function assertPolicyCliOutput(input, expected, message) {
  const output = policyCliOutput(input);
  const parsedOutput = parsePolicyCliOutput(output);

  assertSameMembers(
    Object.keys(parsedOutput),
    Object.keys(classifyChangedFiles([])),
    `${policyCliPath} must emit every classifyChangedFiles key for ${message}`
  );
  assert.deepEqual(parsedOutput, expected, message);
}

function expectedPolicyFlags(expected) {
  return {
    ci_policy_sensitive: false,
    ...expected
  };
}

for (const testCase of cases) {
  assert.deepEqual(classifyChangedFiles(testCase.files), expectedPolicyFlags(testCase.expected), testCase.name);
}

const policyKeys = Object.keys(classifyChangedFiles([])).sort();
const workflowSource = readFileSync(workflowPath, "utf8");
const packageScripts = JSON.parse(readFileSync(packagePath, "utf8")).scripts;
const workflowOutputKeys = workflowChangesOutputs(workflowSource);

assert.match(
  packageScripts["test:entrypoints"],
  /npm run test:public-api-manifest-structure/,
  `${packagePath} scripts.test:entrypoints must include the public API manifest structure smoke so test:js:core reaches the manifest guard`
);

assertPolicyCliOutput(
  "\n README.md \n docs/en/development.md \n\n",
  classifyChangedFiles(["README.md", "docs/en/development.md"]),
  `${policyCliPath} must trim blank and padded stdin lines while emitting workflow output values`
);
assertPolicyCliOutput(
  "Dockerfile\npackage-lock.json\n",
  classifyChangedFiles(["Dockerfile", "package-lock.json"]),
  `${policyCliPath} must emit Docker and package-sensitive workflow output values from stdin`
);
assertPolicyCliOutput(
  "AGENTS.md\n",
  classifyChangedFiles(["AGENTS.md"]),
  `${policyCliPath} must emit CI policy-sensitive routing for AGENTS.md changes`
);
assertPolicyCliOutput(
  ".github/dependabot.yml\n",
  classifyChangedFiles([".github/dependabot.yml"]),
  `${policyCliPath} must emit CI policy-sensitive routing for Dependabot config changes`
);
assertPolicyCliOutput(
  "script/test_ci_workflow_changed_file_detection_signals.mjs\n",
  classifyChangedFiles(["script/test_ci_workflow_changed_file_detection_signals.mjs"]),
  `${policyCliPath} must emit CI policy-sensitive routing for CI policy smoke changes`
);
assertPolicyCliOutput(
  "script/test_ci_workflow_permissions_signals.mjs\n",
  classifyChangedFiles(["script/test_ci_workflow_permissions_signals.mjs"]),
  `${policyCliPath} must emit CI policy-sensitive routing for CI workflow permissions smoke changes`
);

assertSameMembers(
  workflowOutputKeys,
  policyKeys,
  `${workflowPath} jobs.changes.outputs must match classifyChangedFiles result keys`
);

assertWorkflowActionVersions(workflowSource, "actions/checkout", ["v7"]);
assertWorkflowActionVersions(workflowSource, "actions/setup-node", ["v7"]);
assertWorkflowActionVersions(workflowSource, "ruby/setup-ruby", ["v1"]);

const changesJob = workflowJobBlock(workflowSource, "changes");
assertJobMatches(
  changesJob,
  /uses: actions\/checkout@v7[\s\S]*fetch-depth: 0/,
  `${workflowPath} jobs.changes must keep a full checkout for changed-file detection`
);

const lintJob = workflowJobBlock(workflowSource, "lint");
assertJobMatches(lintJob, /ruby-version: "3\.3"/, `${workflowPath} jobs.lint must keep Ruby 3.3`);
assertJobMatches(lintJob, /bundler-cache: true/, `${workflowPath} jobs.lint must keep bundler-cache enabled`);
assertJobMatches(lintJob, /run: bundle exec standardrb/, `${workflowPath} jobs.lint must run StandardRB`);

const prSpecsJob = workflowJobBlock(workflowSource, "pr_specs");
assertJobMatches(
  prSpecsJob,
  /if: github\.event_name == 'pull_request'/,
  `${workflowPath} jobs.pr_specs must stay pull-request gated`
);
assertJobMatches(prSpecsJob, /ruby-version: "3\.3"/, `${workflowPath} jobs.pr_specs must keep Ruby 3.3`);
assertJobMatches(prSpecsJob, /bundler-cache: true/, `${workflowPath} jobs.pr_specs must keep bundler-cache enabled`);
assertJobMatches(prSpecsJob, /run: bundle exec rspec/, `${workflowPath} jobs.pr_specs must run the RSpec suite`);

const prRailsMatrixJob = workflowJobBlock(workflowSource, "pr_rails_matrix");
assertJobMatches(
  prRailsMatrixJob,
  /if: github\.event_name == 'pull_request'/,
  `${workflowPath} jobs.pr_rails_matrix must stay limited to pull request compatibility checks`
);
assertJobMatches(
  prRailsMatrixJob,
  /needs: changes/,
  `${workflowPath} jobs.pr_rails_matrix must depend on changed-file detection`
);
assertJobMatches(
  prRailsMatrixJob,
  /needs\.changes\.outputs\.docs_only == 'true'[\s\S]*Docs-only PR: skipping representative Rails compatibility lane\./,
  `${workflowPath} jobs.pr_rails_matrix must keep the docs-only shortcut while preserving the check name`
);
assertJobMatches(
  prRailsMatrixJob,
  /needs\.changes\.outputs\.docs_only != 'true'[\s\S]*run: bundle exec rake/,
  `${workflowPath} jobs.pr_rails_matrix must run the representative Rails compatibility command for non-docs changes`
);
[
  ["7.0", "gemfiles/rails_7_0.gemfile", "3.2"],
  ["7.2", "gemfiles/rails_7_2.gemfile", "3.2"],
  ["8.0", "gemfiles/rails_8_0.gemfile", "3.3"]
].forEach(([railsVersion, gemfile, rubyVersion]) => {
  assertJobMatches(
    prRailsMatrixJob,
    new RegExp(`rails: "${railsVersion}"[\\s\\S]*gemfile: ${escapeRegExp(gemfile)}[\\s\\S]*ruby-version: "${rubyVersion}"`),
    `${workflowPath} jobs.pr_rails_matrix must keep the Rails ${railsVersion} representative lane`
  );
});

const rubyMatrixJob = workflowJobBlock(workflowSource, "ruby_matrix");
assertJobMatches(
  rubyMatrixJob,
  /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/,
  `${workflowPath} jobs.ruby_matrix must stay limited to pushes on main`
);
assertJobMatches(rubyMatrixJob, /uses: actions\/checkout@v7/, `${workflowPath} jobs.ruby_matrix must keep checkout v7`);
assertJobMatches(rubyMatrixJob, /uses: ruby\/setup-ruby@v1/, `${workflowPath} jobs.ruby_matrix must keep ruby/setup-ruby v1`);
assertJobMatches(rubyMatrixJob, /bundler-cache: true/, `${workflowPath} jobs.ruby_matrix must keep bundler-cache enabled`);
assertJobMatches(rubyMatrixJob, /run: bundle exec rake/, `${workflowPath} jobs.ruby_matrix must run the full rake task on main`);
["3.2", "3.3"].forEach((rubyVersion) => {
  assertJobMatches(
    rubyMatrixJob,
    new RegExp(`- "${escapeRegExp(rubyVersion)}"`),
    `${workflowPath} jobs.ruby_matrix must keep the Ruby ${rubyVersion} main-branch lane`
  );
});

const railsMatrixJob = workflowJobBlock(workflowSource, "rails_matrix");
assertJobMatches(
  railsMatrixJob,
  /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/,
  `${workflowPath} jobs.rails_matrix must stay limited to pushes on main`
);
assertJobMatches(railsMatrixJob, /uses: actions\/checkout@v7/, `${workflowPath} jobs.rails_matrix must keep checkout v7`);
assertJobMatches(railsMatrixJob, /uses: ruby\/setup-ruby@v1/, `${workflowPath} jobs.rails_matrix must keep ruby/setup-ruby v1`);
assertJobMatches(railsMatrixJob, /bundler-cache: true/, `${workflowPath} jobs.rails_matrix must keep bundler-cache enabled`);
assertJobMatches(railsMatrixJob, /BUNDLE_GEMFILE: \$\{\{ matrix\.gemfile \}\}/, `${workflowPath} jobs.rails_matrix must keep per-lane Gemfile wiring`);
assertJobMatches(railsMatrixJob, /run: bundle exec rake/, `${workflowPath} jobs.rails_matrix must run the full rake task on main`);
[
  ["7.0", "gemfiles/rails_7_0.gemfile", "3.2"],
  ["7.1", "gemfiles/rails_7_1.gemfile", "3.2"],
  ["7.2", "gemfiles/rails_7_2.gemfile", "3.2"],
  ["8.0", "gemfiles/rails_8_0.gemfile", "3.3"]
].forEach(([railsVersion, gemfile, rubyVersion]) => {
  assertJobMatches(
    railsMatrixJob,
    new RegExp(`rails: "${railsVersion}"[\\s\\S]*gemfile: ${escapeRegExp(gemfile)}[\\s\\S]*ruby-version: "${rubyVersion}"`),
    `${workflowPath} jobs.rails_matrix must keep the Rails ${railsVersion} main-branch lane`
  );
});

const javascriptJob = workflowJavaScriptJob(workflowSource);
assertJobMatches(
  javascriptJob,
  /needs: changes/,
  `${workflowPath} jobs.javascript must depend on changed-file detection`
);
assert.match(
  javascriptJob,
  /needs\.changes\.outputs\.docs_entrypoint_sensitive == 'true'/,
  `${workflowPath} jobs.javascript must keep docs_entrypoint_sensitive in its package-facing docs condition`
);
assert.match(
  javascriptJob,
  /needs\.changes\.outputs\.ci_policy_sensitive == 'true'/,
  `${workflowPath} jobs.javascript must keep ci_policy_sensitive in its CI policy guard condition`
);
assert.match(
  javascriptJob,
  /run: npm run test:docs-entrypoints/,
  `${workflowPath} jobs.javascript must still run docs entrypoint checks for docs_entrypoint_sensitive changes`
);
assert.match(
  javascriptJob,
  /if: github\.event_name == 'pull_request' && needs\.changes\.outputs\.ci_policy_sensitive == 'true'\n        run: npm run test:ci-policy/,
  `${workflowPath} jobs.javascript must run CI policy checks for any ci_policy_sensitive pull request change`
);
assertJobMatches(javascriptJob, /uses: ruby\/setup-ruby@v1/, `${workflowPath} jobs.javascript must keep Ruby setup for manifest-loading Node smokes`);
assertJobMatches(javascriptJob, /ruby-version: "3\.3"/, `${workflowPath} jobs.javascript must keep Ruby 3.3 for manifest-loading Node smokes`);
assertJobMatches(javascriptJob, /uses: actions\/setup-node@v7/, `${workflowPath} jobs.javascript must keep setup-node v7`);
assertJobMatches(javascriptJob, /node-version: "22"/, `${workflowPath} jobs.javascript must keep the Node 22 CI lane`);
assertJobMatches(javascriptJob, /cache: npm/, `${workflowPath} jobs.javascript must keep npm cache enabled`);
assertJobMatches(javascriptJob, /run: npm ci/, `${workflowPath} jobs.javascript must use npm ci for lockfile-backed installs`);

const dockerDevelopmentSetupJob = workflowJobBlock(workflowSource, "docker_development_setup");
assertJobMatches(
  dockerDevelopmentSetupJob,
  /if: github\.event_name == 'pull_request' && needs\.changes\.outputs\.docker_setup_sensitive == 'true'/,
  `${workflowPath} jobs.docker_development_setup must stay gated by docker_setup_sensitive pull request changes`
);
assertJobMatches(
  dockerDevelopmentSetupJob,
  /needs: changes/,
  `${workflowPath} jobs.docker_development_setup must depend on changed-file detection`
);
assertJobMatches(
  dockerDevelopmentSetupJob,
  /run: docker compose build app/,
  `${workflowPath} jobs.docker_development_setup must keep the Docker app build smoke`
);
assertJobMatches(
  dockerDevelopmentSetupJob,
  /run: docker compose run --rm app/,
  `${workflowPath} jobs.docker_development_setup must keep the Docker app setup smoke`
);
assert.ok(
  dockerDevelopmentSetupJob.includes('node --version | grep -E "^v22\\." && npm --version && npm ci'),
  `${workflowPath} jobs.docker_development_setup must keep the representative Node/npm setup smoke`
);

const gemPackageJob = workflowJobBlock(workflowSource, "gem_package");
assertJobMatches(
  gemPackageJob,
  /github\.event_name == 'pull_request' && needs\.changes\.outputs\.package_sensitive == 'true'/,
  `${workflowPath} jobs.gem_package must stay gated by package_sensitive pull request changes`
);
assertJobMatches(
  gemPackageJob,
  /needs: changes/,
  `${workflowPath} jobs.gem_package must depend on changed-file detection`
);
assertJobMatches(gemPackageJob, /ruby-version: "3\.3"/, `${workflowPath} jobs.gem_package must keep Ruby 3.3`);
assertJobMatches(gemPackageJob, /bundler-cache: true/, `${workflowPath} jobs.gem_package must keep bundler-cache enabled`);
assertJobMatches(gemPackageJob, /run: gem build tree_view\.gemspec/, `${workflowPath} jobs.gem_package must build the gem`);
assertJobMatches(
  gemPackageJob,
  /run: ruby script\/check_gem_package_contents\.rb tree_view-\*\.gem/,
  `${workflowPath} jobs.gem_package must run package contents verification`
);
assertJobMatches(gemPackageJob, /run: gem install tree_view-\*\.gem/, `${workflowPath} jobs.gem_package must install the built gem`);
assertJobMatches(gemPackageJob, /run: ruby -e "require 'tree_view'"/, `${workflowPath} jobs.gem_package must keep the installed gem require smoke`);

assertCiPolicyScriptRegistration(packageScripts);

for (const scriptName of npmRunScripts(workflowSource)) {
  assert.ok(
    Object.prototype.hasOwnProperty.call(packageScripts, scriptName),
    `${workflowPath} jobs.javascript runs npm script "${scriptName}", but ${packagePath} scripts does not define it`
  );
}

console.log(`Checked ${cases.length} CI changed-file policy cases.`);
console.log(`Checked ${workflowOutputKeys.length} workflow output keys and ${npmRunScripts(workflowSource).length} JavaScript npm commands.`);
console.log(`Checked ${ciPolicyGuardScriptPaths.length} CI policy script registrations.`);
console.log("Checked representative CI workflow setup surfaces.");
