#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASELINE_TAG = "prod-before-minute-billing-2026-09-01";
const BASELINE_COMMIT = "844bfbd5d8be87cac4e5f373960b17b7bcd6da46";
const dryRun = process.argv.some((argument) => argument === "--dry-run" || argument === "--dry-run=true") || process.env.BILLING_ROLLBACK_DRY_RUN === "1";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    const detail = options.capture ? `${result.stdout || ""}${result.stderr || ""}`.trim() : "";
    throw new Error(`${command} ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
  }
  return options.capture ? result.stdout.trim() : "";
}

function git(...args) {
  return run("git", args, { capture: true });
}

function ensureSafeState() {
  const branch = git("branch", "--show-current");
  if (branch !== "main") throw new Error(`Rollback must be launched from main, current branch is ${branch || "detached HEAD"}.`);
  const gitDir = git("rev-parse", "--git-dir");
  const gitPath = path.resolve(root, gitDir);
  for (const marker of ["MERGE_HEAD", "rebase-merge", "rebase-apply", "CHERRY_PICK_HEAD"]) {
    const probe = spawnSync("git", ["rev-parse", "--verify", "-q", marker], { cwd: root, stdio: "ignore", shell: process.platform === "win32" });
    if (probe.status === 0 || ["rebase-merge", "rebase-apply"].includes(marker) && existsSync(path.join(gitPath, marker))) {
      throw new Error("Finish the current merge, rebase, or cherry-pick before rollback.");
    }
  }
}

function main() {
  ensureSafeState();
  run("git", ["fetch", "origin", "main", "--tags"]);
  const resolvedBaseline = git("rev-list", "-n", "1", BASELINE_TAG);
  if (resolvedBaseline !== BASELINE_COMMIT) throw new Error(`Baseline tag points to ${resolvedBaseline}, expected ${BASELINE_COMMIT}.`);
  const head = git("rev-parse", "HEAD");
  const remoteHead = git("rev-parse", "origin/main");
  if (head !== remoteHead) throw new Error("Local main and origin/main differ. Synchronize them before rollback.");

  const dirty = Boolean(git("status", "--porcelain"));
  console.log(`Baseline: ${BASELINE_TAG} (${BASELINE_COMMIT.slice(0, 7)})`);
  console.log(`Current main: ${head.slice(0, 7)}`);
  console.log(`Uncommitted changes: ${dirty ? "will be saved to stash" : "none"}`);
  console.log("Rollback strategy: forward restore commit + push to origin/main (no force push).");
  if (dryRun) {
    console.log("Dry run complete. No files, commits, or remote refs were changed.");
    return;
  }

  if (dirty) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    run("git", ["stash", "push", "--include-untracked", "-m", `auto-backup-before-prod-restore-${stamp}`]);
  }

  run("git", ["restore", "--source", BASELINE_TAG, "--staged", "--worktree", "--", "."]);
  if (!git("status", "--porcelain")) {
    console.log("The working tree already matches the production baseline.");
    return;
  }

  run("npm", ["run", "build"]);
  run("npm", ["run", "test:sites"]);
  run("git", ["commit", "-m", "Restore production baseline before minute billing simulator"]);
  run("git", ["push", "origin", "main"]);
  console.log("Production baseline restored and pushed to origin/main.");
}

try {
  main();
} catch (error) {
  console.error(`Rollback stopped safely: ${error.message}`);
  process.exitCode = 1;
}
