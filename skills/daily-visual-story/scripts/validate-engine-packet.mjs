#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  validateAdaptationInput,
  validateFormatContract,
  validateNarrativeSpec,
  validateOutputInput,
  validateOutputStyle,
  validateStoryboardApproval,
  validateStoryboardHandoff,
} from "./engine-contracts.mjs";

const VALIDATORS = {
  narrative: validateNarrativeSpec,
  "format-contract": validateFormatContract,
  "adaptation-input": validateAdaptationInput,
  "storyboard-approval": validateStoryboardApproval,
  "storyboard-handoff": validateStoryboardHandoff,
  "output-style": validateOutputStyle,
  "output-input": validateOutputInput,
};

function usage() {
  return "Usage: validate-engine-packet.mjs --type narrative|format-contract|adaptation-input|storyboard-approval|storyboard-handoff|output-style|output-input --input <json-path>";
}

function parseArgs(argv) {
  const args = { type: "", input: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--type") args.type = argv[++index] || "";
    else if (arg.startsWith("--type=")) args.type = arg.slice("--type=".length);
    else if (arg === "--input") args.input = argv[++index] || "";
    else if (arg.startsWith("--input=")) args.input = arg.slice("--input=".length);
    else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else throw new Error(`unknown argument: ${arg}`);
  }
  if (!VALIDATORS[args.type] || !args.input) throw new Error(usage());
  return args;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const packet = JSON.parse(readFileSync(args.input, "utf8"));
    VALIDATORS[args.type](packet);
    process.stdout.write(`${JSON.stringify({ ok: true, type: args.type, input: args.input })}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
