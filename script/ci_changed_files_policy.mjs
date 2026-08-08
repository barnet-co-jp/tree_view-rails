export function classifyChangedFiles(files) {
  const result = {
    docs_only: true,
    mockups_changed: false,
    browser_smoke_changed: false,
    package_sensitive: false,
    docker_setup_sensitive: false,
    docs_entrypoint_sensitive: false,
    ci_policy_sensitive: false
  };

  for (const file of files.map((entry) => entry.trim()).filter(Boolean)) {
    if (!isDocsOnlyPath(file)) {
      result.docs_only = false;
    }

    if (file.startsWith("docs/mockups/")) {
      result.mockups_changed = true;
    }

    if (file.startsWith("test/browser/")) {
      result.browser_smoke_changed = true;
    }

    if (isPackageSensitivePath(file)) {
      result.package_sensitive = true;
    }

    if (isDockerSetupSensitivePath(file)) {
      result.docker_setup_sensitive = true;
    }

    if (isDocsEntrypointSensitivePath(file)) {
      result.docs_entrypoint_sensitive = true;
    }

    if (isCiPolicySensitivePath(file)) {
      result.ci_policy_sensitive = true;
    }
  }

  return result;
}

function isDocsOnlyPath(file) {
  return (
    file === "README.md" ||
    file.startsWith("docs/") ||
    file === "Product Profile.md" ||
    file === "CHANGELOG.md" ||
    file === "AGENTS.md"
  );
}

function isWorkflowDefinitionPath(file) {
  return file.startsWith(".github/workflows/") && (file.endsWith(".yml") || file.endsWith(".yaml"));
}

function isLicenseFilePath(file) {
  return file === "LICENSE" || file.startsWith("LICENSE.") || file.startsWith("LICENSE-");
}

function isPackageSensitivePath(file) {
  return (
    file === "README.md" ||
    file === "CHANGELOG.md" ||
    file.startsWith("docs/") ||
    isLicenseFilePath(file) ||
    file === "Gemfile" ||
    file === "Gemfile.lock" ||
    file === "Rakefile" ||
    file === "tree_view.gemspec" ||
    file === "package.json" ||
    file === "package-lock.json" ||
    file === ".nvmrc" ||
    file === "script/check_gem_package_contents.rb" ||
    isWorkflowDefinitionPath(file) ||
    file === ".github/dependabot.yml" ||
    file === "config/importmap.tree_view.rb" ||
    file === "config/public_api_manifest.yml" ||
    file.startsWith("lib/") ||
    file.startsWith("app/helpers/") ||
    file.startsWith("app/views/") ||
    file.startsWith("app/assets/") ||
    file.startsWith("app/javascript/") ||
    file.startsWith("config/locales/")
  );
}

function isDocsEntrypointSensitivePath(file) {
  return (
    file === "README.md" ||
    file === "CHANGELOG.md" ||
    file.startsWith("docs/") ||
    file === "config/importmap.tree_view.rb" ||
    file === "config/public_api_manifest.yml"
  );
}

function isCiPolicySensitivePath(file) {
  return (
    file === "AGENTS.md" ||
    isWorkflowDefinitionPath(file) ||
    file === ".github/dependabot.yml" ||
    file === "docs/en/ci-policy-suite.md" ||
    file === "docs/ja/ci-policy-suite.md" ||
    file === "script/ci_changed_files_policy.mjs" ||
    file === "script/test_ci_policy_suite.mjs" ||
    file === "script/test_ci_changed_files_policy.mjs" ||
    file === "script/test_ci_dependabot_maintenance_evidence_signals.mjs" ||
    file === "script/test_ci_policy_docs_routing.mjs" ||
    file === "script/test_ci_workflow_changed_file_detection_signals.mjs" ||
    file === "script/test_ci_matrix_boundary_signals.mjs" ||
    file === "script/test_ci_workflow_concurrency_signals.mjs" ||
    file === "script/test_ci_workflow_permissions_signals.mjs" ||
    file === "script/test_ci_policy_permissions_docs_signals.mjs" ||
    file === "script/test_ci_observation_guidance_signals.mjs" ||
    file === "script/test_importmap_docs_entrypoint_routing.mjs" ||
    file === "script/test_license_package_sensitive_signal.mjs" ||
    file === "script/test_package_lock_dependency_drift.mjs" ||
    file === "script/test_gemfile_lock_dependency_drift.mjs"
  );
}

function isDockerSetupSensitivePath(file) {
  return (
    file === "Dockerfile" ||
    file === "docker-compose.yml" ||
    file === "package.json" ||
    file === "package-lock.json" ||
    file === ".nvmrc" ||
    isWorkflowDefinitionPath(file)
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = await readStdin();
  const result = classifyChangedFiles(input.split(/\r?\n/));

  for (const [key, value] of Object.entries(result)) {
    console.log(`${key}=${value}`);
  }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
  });
}
