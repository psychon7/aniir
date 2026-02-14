import { readFile } from "node:fs/promises";
import { validateConfig, withConfigDefaults } from "./schema.js";

function parseScalar(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (!Number.isNaN(Number(trimmed)) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

function nextSignificantLine(lines, from) {
  for (let i = from; i < lines.length; i += 1) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    return raw;
  }
  return null;
}

function parseYaml(text) {
  const lines = text.replace(/\t/g, "  ").split("\n");
  const root = {};
  const stack = [{ indent: -1, container: root }];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = raw.length - raw.trimStart().length;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].container;
    if (trimmed.startsWith("- ")) {
      if (!Array.isArray(parent)) {
        throw new Error("Invalid YAML list placement");
      }
      const itemText = trimmed.slice(2).trim();
      if (!itemText) {
        const item = {};
        parent.push(item);
        stack.push({ indent, container: item });
      } else {
        parent.push(parseScalar(itemText));
      }
      continue;
    }

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) {
      throw new Error(`Invalid YAML line: ${trimmed}`);
    }

    const key = trimmed.slice(0, colonIndex).trim();
    const valueText = trimmed.slice(colonIndex + 1).trim();

    if (valueText) {
      parent[key] = parseScalar(valueText);
      continue;
    }

    const nextLine = nextSignificantLine(lines, i + 1);
    const childShouldBeArray =
      !!nextLine &&
      nextLine.length - nextLine.trimStart().length > indent &&
      nextLine.trimStart().startsWith("- ");

    const child = childShouldBeArray ? [] : {};
    parent[key] = child;
    stack.push({ indent, container: child });
  }

  return root;
}

function parseConfigText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return parseYaml(text);
  }
}

export async function loadConfig(filePath) {
  const raw = await readFile(filePath, "utf8");
  const parsed = parseConfigText(raw);
  return validateConfig(withConfigDefaults(parsed));
}
