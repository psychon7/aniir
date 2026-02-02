#!/usr/bin/env node
/**
 * Run pending tasks using OpenAI Codex CLI (GPT-5.2)
 * 
 * This script bypasses AutoMaker and runs tasks directly with codex CLI
 * 
 * Prerequisites:
 *   npm install -g @openai/codex-cli
 *   export OPENAI_API_KEY=your-key
 * 
 * Usage:
 *   node scripts/run-with-codex-cli.mjs --list          # List pending tasks
 *   node scripts/run-with-codex-cli.mjs --task P1-001   # Run specific task
 *   node scripts/run-with-codex-cli.mjs --next          # Run next pending task
 *   node scripts/run-with-codex-cli.mjs --batch 5       # Run next 5 tasks
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FEATURES_DIR = path.join(PROJECT_ROOT, '.automaker', 'features');

/**
 * Load all features
 */
async function loadFeatures() {
  const features = [];
  const dirs = await fs.readdir(FEATURES_DIR);
  
  for (const dir of dirs) {
    try {
      const content = await fs.readFile(path.join(FEATURES_DIR, dir, 'feature.json'), 'utf-8');
      const feature = JSON.parse(content);
      feature._dir = dir;
      features.push(feature);
    } catch (e) {}
  }
  
  return features;
}

/**
 * Get pending tasks sorted by priority
 */
async function getPendingTasks() {
  const features = await loadFeatures();
  return features
    .filter(f => f.status === 'pending' || f.status === 'backlog')
    .sort((a, b) => {
      // Sort by prompt number, then task number
      const aMatch = a.id.match(/p(\d+)-(\d+)/);
      const bMatch = b.id.match(/p(\d+)-(\d+)/);
      if (aMatch && bMatch) {
        const promptDiff = parseInt(aMatch[1]) - parseInt(bMatch[1]);
        if (promptDiff !== 0) return promptDiff;
        return parseInt(aMatch[2]) - parseInt(bMatch[2]);
      }
      return 0;
    });
}

/**
 * Build prompt for Codex CLI
 */
function buildPrompt(feature) {
  return `You are an expert software engineer working on an ERP system refactor.

PROJECT: FastAPI + React + SQL Server ERP System
WORKING DIRECTORY: ${PROJECT_ROOT}

TASK: ${feature.title}

DESCRIPTION:
${feature.description}

CRITICAL REQUIREMENTS:
1. Use EXISTING SQL Server database - NO schema migrations
2. Use exact table names (TM_CLI_Client, TR_STA_Status, etc.)
3. Use exact column names from existing schema
4. Follow existing code patterns in the codebase
5. Write production-ready code with proper error handling

CONTEXT FILES TO REFERENCE:
- Refactor/reference/database-schema.md - SQL Server schema
- Refactor/reference/business-logic.md - Business rules
- Refactor/reference/frontend-modules.md - Frontend structure
- backend/app/ - Existing backend code

Please implement this task. Create or modify the necessary files.
After completion, summarize what you did.`;
}

/**
 * Run task with Codex CLI
 */
async function runWithCodex(feature) {
  const prompt = buildPrompt(feature);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Running: ${feature.title}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Write prompt to temp file
  const promptFile = path.join(PROJECT_ROOT, '.codex-prompt.md');
  await fs.writeFile(promptFile, prompt);
  
  return new Promise((resolve, reject) => {
    // Run codex CLI with correct model name
    const codex = spawn('codex', [
      '--model', 'gpt-5.1-codex',
      '--approval-mode', 'full-auto',
      '--quiet',
      prompt
    ], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    codex.on('close', async (code) => {
      if (code === 0) {
        // Mark task as completed
        feature.status = 'verified';
        feature.completedAt = new Date().toISOString();
        feature.completedBy = 'codex-cli-gpt5.2';
        
        const featurePath = path.join(FEATURES_DIR, feature._dir, 'feature.json');
        delete feature._dir;
        await fs.writeFile(featurePath, JSON.stringify(feature, null, 2));
        
        console.log(`\n✅ Task completed: ${feature.title}\n`);
        resolve(true);
      } else {
        console.log(`\n❌ Task failed with code ${code}\n`);
        resolve(false);
      }
    });
    
    codex.on('error', (err) => {
      console.error(`\n❌ Error running codex: ${err.message}\n`);
      reject(err);
    });
  });
}

/**
 * Alternative: Run with Claude Code CLI
 */
async function runWithClaude(feature) {
  const prompt = buildPrompt(feature);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Running: ${feature.title}`);
  console.log(`${'='.repeat(60)}\n`);
  
  return new Promise((resolve, reject) => {
    const claude = spawn('claude', [
      '--print',
      '--dangerously-skip-permissions',
      prompt
    ], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    claude.on('close', async (code) => {
      if (code === 0) {
        feature.status = 'verified';
        feature.completedAt = new Date().toISOString();
        feature.completedBy = 'claude-code-cli';
        
        const featurePath = path.join(FEATURES_DIR, feature._dir, 'feature.json');
        const dir = feature._dir;
        delete feature._dir;
        await fs.writeFile(featurePath, JSON.stringify(feature, null, 2));
        
        console.log(`\n✅ Task completed: ${feature.title}\n`);
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    claude.on('error', reject);
  });
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
OpenAI Codex CLI Task Runner

Usage:
  node run-with-codex-cli.mjs --list              List pending tasks
  node run-with-codex-cli.mjs --task P1-001       Run specific task
  node run-with-codex-cli.mjs --next              Run next pending task
  node run-with-codex-cli.mjs --batch 5           Run next N tasks
  node run-with-codex-cli.mjs --claude            Use Claude CLI instead

Prerequisites:
  npm install -g @openai/codex-cli
  export OPENAI_API_KEY=your-key
  
  OR for Claude:
  Install Claude Code CLI and authenticate
`);
  process.exit(0);
}

if (args.includes('--list')) {
  const tasks = await getPendingTasks();
  console.log(`\n📋 Pending Tasks (${tasks.length}):\n`);
  tasks.slice(0, 30).forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.title?.substring(0, 70)}`);
  });
  if (tasks.length > 30) {
    console.log(`  ... and ${tasks.length - 30} more`);
  }
  process.exit(0);
}

const useClaude = args.includes('--claude');
const runner = useClaude ? runWithClaude : runWithCodex;
const modelName = useClaude ? 'Claude Code CLI' : 'OpenAI Codex CLI (gpt-5.1-codex)';

if (args.includes('--task')) {
  const taskId = args[args.indexOf('--task') + 1]?.toUpperCase();
  const tasks = await getPendingTasks();
  const task = tasks.find(t => t.title?.includes(taskId));
  
  if (!task) {
    console.error(`❌ Task not found: ${taskId}`);
    process.exit(1);
  }
  
  console.log(`\n🤖 Using: ${modelName}`);
  await runner(task);
}

if (args.includes('--next')) {
  const tasks = await getPendingTasks();
  if (tasks.length === 0) {
    console.log('✅ All tasks completed!');
    process.exit(0);
  }
  
  console.log(`\n🤖 Using: ${modelName}`);
  console.log(`📊 Remaining tasks: ${tasks.length}`);
  await runner(tasks[0]);
}

if (args.includes('--batch')) {
  const count = parseInt(args[args.indexOf('--batch') + 1]) || 5;
  const tasks = await getPendingTasks();
  
  console.log(`\n🤖 Using: ${modelName}`);
  console.log(`📊 Running ${Math.min(count, tasks.length)} of ${tasks.length} pending tasks\n`);
  
  let completed = 0;
  let failed = 0;
  
  for (let i = 0; i < Math.min(count, tasks.length); i++) {
    try {
      const success = await runner(tasks[i]);
      if (success) completed++;
      else failed++;
    } catch (e) {
      failed++;
      console.error(`Error: ${e.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Batch Complete: ${completed} succeeded, ${failed} failed`);
  console.log(`${'='.repeat(60)}`);
}
