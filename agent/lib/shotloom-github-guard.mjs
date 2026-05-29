#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function usage() {
  console.error(`Usage:
  shotloom-github-guard.mjs [--require-git-author] [--pr <number>] [--repo owner/name] [--login login] [--print-json]

Checks the active GitHub login, optionally checks git commit author identity,
and optionally verifies a PR is assigned to the required login.`);
}

let parsedArgs = { printJson: false };

function parseArgs(argv) {
  const args = {
    login: "tomlim2",
    author: "tomlim2 <deemo@vonvon.me>",
    repo: process.env.GH_REPO || "CINEV/shotloom",
    pr: "",
    requireGitAuthor: false,
    printJson: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--login") {
      args.login = argv[++i] || "";
    } else if (arg === "--author") {
      args.author = argv[++i] || "";
    } else if (arg === "--repo") {
      args.repo = argv[++i] || "";
    } else if (arg === "--pr") {
      args.pr = argv[++i] || "";
    } else if (arg === "--require-git-author") {
      args.requireGitAuthor = true;
    } else if (arg === "--print-json") {
      args.printJson = true;
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      usage();
      process.exit(2);
    }
  }

  if (!args.login || !args.author || !args.repo.includes("/")) {
    usage();
    process.exit(2);
  }
  if (args.pr && !/^[0-9]+$/.test(args.pr)) {
    usage();
    process.exit(2);
  }

  return args;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  return {
    status: result.status ?? 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function fail(message, detail = "") {
  if (parsedArgs.printJson) {
    process.stdout.write(
      `${JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2)}\n`,
    );
  }
  console.error(`ERROR: ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
parsedArgs = args;

const ghLogin = run("gh", ["api", "user", "--jq", ".login"]);
if (ghLogin.status !== 0) {
  fail("unable to read active GitHub login", ghLogin.stderr || ghLogin.stdout);
}
if (ghLogin.stdout !== args.login) {
  fail(`active GitHub login must be ${args.login}`, `got: ${ghLogin.stdout}`);
}

let actualAuthor = "";
const name = run("git", ["config", "user.name"]);
const email = run("git", ["config", "user.email"]);
if (name.status === 0 && email.status === 0) {
  actualAuthor = `${name.stdout} <${email.stdout}>`;
} else if (args.requireGitAuthor) {
  fail("unable to read git author identity", name.stderr || email.stderr);
}
if (args.requireGitAuthor && actualAuthor !== args.author) {
  fail(`git author identity must be ${args.author}`, `got: ${actualAuthor}`);
}

let assignees = [];
if (args.pr) {
  const view = run("gh", [
    "pr",
    "view",
    args.pr,
    "--repo",
    args.repo,
    "--json",
    "assignees",
  ]);
  if (view.status !== 0) {
    fail(`unable to read PR #${args.pr}`, view.stderr || view.stdout);
  }
  const data = JSON.parse(view.stdout);
  assignees = (data.assignees || []).map((item) => item.login);
  if (!assignees.includes(args.login)) {
    fail(
      `PR #${args.pr} in ${args.repo} is not assigned to ${args.login}`,
      `current assignees: ${assignees.join(", ") || "(none)"}`,
    );
  }
}

const summary = {
  ok: true,
  repo: args.repo,
  "required-login": args.login,
  "gh-login": ghLogin.stdout,
  "required-git-identity": args.author,
  "git-identity": actualAuthor,
  "git-identity-required": args.requireGitAuthor,
  pr: args.pr || null,
  "pr-assignees": assignees,
};

if (args.printJson) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  console.error(`OK: Shotloom GitHub guard passed for ${args.login}.`);
}
