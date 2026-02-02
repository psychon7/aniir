#!/usr/bin/env node
/**
 * Run pending tasks using OpenRouter API
 * 
 * Uses Claude Opus 4 or other models via OpenRouter
 * 
 * Usage:
 *   node scripts/run-with-openrouter.mjs --list          # List pending tasks
 *   node scripts/run-with-openrouter.mjs --task P1-001   # Run specific task
 *   node scripts/run-with-openrouter.mjs --next          # Run next pending task
 *   node scripts/run-with-openrouter.mjs --batch 5       # Run next 5 tasks
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FEATURES_DIR = path.join(PROJECT_ROOT, '.automaker', 'features');

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Available models on OpenRouter
const MODELS = {
  coding: 'anthropic/claude-opus-4.5',     // Claude Opus 4.5 for coding tasks
  nonCoding: 'anthropic/claude-haiku-4.5', // Claude Haiku 4.5 for non-coding tasks
  fallback: 'anthropic/claude-sonnet-4',   // Fallback
};

const DEFAULT_MODEL = MODELS.coding;

/**
 * Make OpenRouter API request
 */
async function callOpenRouter(messages, model = DEFAULT_MODEL) {
  const data = JSON.stringify({
    model,
    messages,
    max_tokens: 8000,  // Reduced to fit within credit limits
    temperature: 0.1,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://github.com/user/erp2025',
        'X-Title': 'ERP2025 Task Runner',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) {
            reject(new Error(json.error.message || JSON.stringify(json.error)));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

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
 * Read file content safely
 */
async function readFileSafe(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Build system prompt with project context
 */
async function buildSystemPrompt() {
  // Read reference docs for context
  const schemaDoc = await readFileSafe(path.join(PROJECT_ROOT, 'Refactor/reference/database-schema.md'));
  const businessDoc = await readFileSafe(path.join(PROJECT_ROOT, 'Refactor/reference/business-logic.md'));
  
  return `You are an expert software engineer working on an ERP system refactor.

## PROJECT CONTEXT
- **Stack**: FastAPI (Python) + React (TypeScript) + SQL Server
- **Working Directory**: ${PROJECT_ROOT}
- **Critical**: Use EXISTING SQL Server database - NO schema migrations

## EXISTING DATABASE SCHEMA (excerpt)
${schemaDoc ? schemaDoc.substring(0, 4000) : 'See Refactor/reference/database-schema.md'}

## BUSINESS LOGIC PATTERNS (excerpt)
${businessDoc ? businessDoc.substring(0, 2000) : 'See Refactor/reference/business-logic.md'}

## CODING STANDARDS
1. Use SQLAlchemy 2.0 with exact table/column names from existing schema
2. Use Pydantic v2 for schemas
3. Use FastAPI dependency injection
4. Follow existing patterns in backend/app/
5. Use React 18 + TanStack Query + shadcn/ui for frontend

## OUTPUT FORMAT
Provide complete, production-ready code. For each file:
\`\`\`language:path/to/file.ext
// complete file content
\`\`\`

Be thorough and implement the full solution.`;
}

/**
 * Build user prompt for a task
 */
function buildUserPrompt(feature) {
  return `## TASK: ${feature.title}

${feature.description}

Please implement this task completely. Provide all necessary code files with their full paths.
After implementation, summarize what you created/modified.`;
}

/**
 * Parse code blocks from response
 */
function parseCodeBlocks(content) {
  const blocks = [];
  const regex = /```(\w+)?:?([^\n]*)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const language = match[1] || '';
    const filePath = match[2]?.trim() || '';
    const code = match[3];
    
    if (filePath && code) {
      blocks.push({ language, filePath, code });
    }
  }
  
  return blocks;
}

/**
 * Write code blocks to files
 */
async function writeCodeBlocks(blocks) {
  let written = 0;
  
  for (const block of blocks) {
    if (!block.filePath) continue;
    
    const fullPath = block.filePath.startsWith('/') 
      ? block.filePath 
      : path.join(PROJECT_ROOT, block.filePath);
    
    try {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, block.code);
      console.log(`   ✓ Wrote: ${block.filePath}`);
      written++;
    } catch (e) {
      console.log(`   ✗ Failed to write: ${block.filePath} - ${e.message}`);
    }
  }
  
  return written;
}

/**
 * Run task with OpenRouter
 */
async function runTask(feature, model = DEFAULT_MODEL) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Running: ${feature.title}`);
  console.log(`🤖 Model: ${model}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    const systemPrompt = await buildSystemPrompt();
    const userPrompt = buildUserPrompt(feature);
    
    console.log('📤 Sending request to OpenRouter...');
    
    const response = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], model);
    
    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from API');
    }
    
    console.log('\n📥 Response received. Processing...\n');
    
    // Parse and write code blocks
    const blocks = parseCodeBlocks(content);
    
    if (blocks.length > 0) {
      console.log(`📝 Found ${blocks.length} code blocks to write:`);
      const written = await writeCodeBlocks(blocks);
      console.log(`\n✅ Wrote ${written} files`);
    } else {
      console.log('ℹ️  No code blocks with file paths found in response');
      console.log('\n--- Response ---');
      console.log(content.substring(0, 2000));
      if (content.length > 2000) console.log('... (truncated)');
    }
    
    // Save response to agent output
    const outputPath = path.join(FEATURES_DIR, feature._dir, 'agent-output.md');
    await fs.writeFile(outputPath, `# Agent Output: ${feature.title}\n\nModel: ${model}\nDate: ${new Date().toISOString()}\n\n${content}`);
    
    // Mark task as completed
    feature.status = 'verified';
    feature.completedAt = new Date().toISOString();
    feature.completedBy = `openrouter:${model}`;
    
    const featurePath = path.join(FEATURES_DIR, feature._dir, 'feature.json');
    const toSave = { ...feature };
    delete toSave._dir;
    await fs.writeFile(featurePath, JSON.stringify(toSave, null, 2));
    
    // Log usage
    if (response.usage) {
      console.log(`\n📊 Tokens: ${response.usage.prompt_tokens} in, ${response.usage.completion_tokens} out`);
    }
    
    console.log(`\n✅ Task completed: ${feature.title}\n`);
    return true;
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    
    // Save error to output
    const outputPath = path.join(FEATURES_DIR, feature._dir, 'agent-output.md');
    await fs.writeFile(outputPath, `# Agent Output: ${feature.title}\n\nError: ${error.message}\nDate: ${new Date().toISOString()}`);
    
    return false;
  }
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
OpenRouter Task Runner

Usage:
  node run-with-openrouter.mjs --list              List pending tasks
  node run-with-openrouter.mjs --task P1-001       Run specific task
  node run-with-openrouter.mjs --next              Run next pending task
  node run-with-openrouter.mjs --batch 5           Run next N tasks
  node run-with-openrouter.mjs --model <name>      Use specific model

Available Models:
${MODELS.map((m, i) => `  ${i === 0 ? '* ' : '  '}${m}`).join('\n')}

Environment:
  OPENROUTER_API_KEY    Your OpenRouter API key (or uses built-in)
`);
  process.exit(0);
}

// Get model from args
let selectedModel = DEFAULT_MODEL;
if (args.includes('--model')) {
  const modelArg = args[args.indexOf('--model') + 1];
  if (modelArg) {
    selectedModel = modelArg;
  }
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

if (args.includes('--task')) {
  const taskId = args[args.indexOf('--task') + 1]?.toUpperCase();
  const tasks = await getPendingTasks();
  const task = tasks.find(t => t.title?.includes(taskId));
  
  if (!task) {
    console.error(`❌ Task not found: ${taskId}`);
    process.exit(1);
  }
  
  console.log(`\n🤖 Using: OpenRouter (${selectedModel})`);
  await runTask(task, selectedModel);
}

if (args.includes('--next')) {
  const tasks = await getPendingTasks();
  if (tasks.length === 0) {
    console.log('✅ All tasks completed!');
    process.exit(0);
  }
  
  console.log(`\n🤖 Using: OpenRouter (${selectedModel})`);
  console.log(`📊 Remaining tasks: ${tasks.length}`);
  await runTask(tasks[0], selectedModel);
}

if (args.includes('--batch')) {
  const count = parseInt(args[args.indexOf('--batch') + 1]) || 5;
  const tasks = await getPendingTasks();
  
  console.log(`\n🤖 Using: OpenRouter (${selectedModel})`);
  console.log(`📊 Running ${Math.min(count, tasks.length)} of ${tasks.length} pending tasks\n`);
  
  let completed = 0;
  let failed = 0;
  
  for (let i = 0; i < Math.min(count, tasks.length); i++) {
    try {
      const success = await runTask(tasks[i], selectedModel);
      if (success) completed++;
      else failed++;
      
      // Small delay between tasks
      if (i < count - 1) {
        console.log('⏳ Waiting 2s before next task...');
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (e) {
      failed++;
      console.error(`Error: ${e.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Batch Complete: ${completed} succeeded, ${failed} failed`);
  console.log(`${'='.repeat(60)}`);
}
