#!/usr/bin/env node
/**
 * Import Refactor TODO tasks into AutoMaker
 * 
 * Usage:
 *   node scripts/import-to-automaker.mjs [--project-path /path/to/project]
 * 
 * This script:
 * 1. Parses markdown todo files from Refactor/todos/
 * 2. Converts them to AutoMaker feature format
 * 3. Writes them to .automaker/features/ directory
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  todosDir: path.join(PROJECT_ROOT, 'Refactor', 'todos'),
  automakerDir: path.join(PROJECT_ROOT, '.automaker'),
  featuresDir: path.join(PROJECT_ROOT, '.automaker', 'features'),
};

/**
 * Generate a unique feature ID
 */
function generateFeatureId(taskId, title) {
  const hash = crypto.createHash('md5').update(`${taskId}-${title}`).digest('hex').slice(0, 8);
  return `${taskId.toLowerCase()}-${hash}`;
}

/**
 * Parse markdown table rows into task objects
 * Handles multiple formats:
 * - | Task ID | Description | Effort |
 * - | ID | Task | Effort |
 */
function parseMarkdownTable(content, groupName, promptNumber) {
  const tasks = [];
  const lines = content.split('\n');
  
  let inTable = false;
  let currentSubgroup = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect subgroup headers (### SQL Scripts, ### Backend, ### Frontend)
    if (trimmed.startsWith('### ')) {
      currentSubgroup = trimmed.replace('### ', '');
      continue;
    }
    
    // Detect table header - multiple formats
    if (trimmed.match(/^\|\s*(Task ID|ID)\s*\|/) || trimmed.startsWith('|------') || trimmed.startsWith('|----')) {
      inTable = true;
      continue;
    }
    
    // Parse table rows - match P1-xxx, P2-xxx, P3-xxx format
    if (inTable && trimmed.startsWith('|') && !trimmed.startsWith('|---')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean);
      
      if (cells.length >= 2 && cells[0].match(/^P\d+-\d+$/)) {
        const taskId = cells[0];
        const description = cells[1].replace(/`/g, '').replace(/\*\*/g, '');
        const effortOrTable = cells[2] || 'Medium';
        
        // Check if third column is a table name (starts with TM_ or TR_ or contains .sql)
        const isTableName = effortOrTable.match(/^`?(TM_|TR_|\/SQL)/);
        const effort = isTableName ? 'Medium' : effortOrTable;
        const tableName = isTableName ? effortOrTable.replace(/`/g, '') : null;
        
        tasks.push({
          taskId,
          description,
          effort,
          tableName,
          groupName: currentSubgroup ? `${groupName} > ${currentSubgroup}` : groupName,
          promptNumber,
        });
      }
    }
    
    // End of table on empty line or new section
    if (inTable && (trimmed === '' || trimmed.startsWith('**'))) {
      inTable = false;
    }
  }
  
  return tasks;
}

/**
 * Extract groups and their tasks from markdown content
 * Handles multiple formats:
 * - ### Group 1: Name (prompt-1)
 * - ## Group A: Name (prompt-2, prompt-3)
 */
function extractTasksFromMarkdown(content, filename) {
  const promptMatch = filename.match(/todo-prompt-(\d+)/);
  const promptNumber = promptMatch ? parseInt(promptMatch[1]) : 1;
  
  const allTasks = [];
  
  // Match both formats: "### Group N:" and "## Group X:"
  const groupPattern = /^(#{2,3})\s+(Group\s+[A-Z0-9]+:\s*[^\n]+)/gm;
  const groups = [];
  
  let match;
  while ((match = groupPattern.exec(content)) !== null) {
    groups.push({
      name: match[2].trim(),
      startIndex: match.index,
    });
  }
  
  // If no groups found, try parsing the whole content
  if (groups.length === 0) {
    const tasks = parseMarkdownTable(content, 'Uncategorized', promptNumber);
    return tasks;
  }
  
  // Extract tasks from each group
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const nextGroup = groups[i + 1];
    const endIndex = nextGroup ? nextGroup.startIndex : content.length;
    const groupContent = content.slice(group.startIndex, endIndex);
    
    const tasks = parseMarkdownTable(groupContent, group.name, promptNumber);
    allTasks.push(...tasks);
  }
  
  return allTasks;
}

/**
 * Convert task to AutoMaker feature format with dependencies
 */
function taskToFeature(task, index, allTasks) {
  const featureId = generateFeatureId(task.taskId, task.description);
  
  // Build description with context
  let description = task.description;
  if (task.tableName) {
    description += `\n\nTable: \`${task.tableName}\``;
  }
  description += `\n\n**Source**: ${task.groupName} (Prompt ${task.promptNumber})`;
  description += `\n**Effort**: ${task.effort}`;
  
  // Map effort to priority
  const priorityMap = {
    'Small': 3,
    'Medium': 2,
    'Large': 1,
  };
  
  // Calculate dependencies based on task order and group
  const dependencies = calculateDependencies(task, allTasks);
  
  return {
    id: featureId,
    title: `[${task.taskId}] ${task.description}`,
    description,
    status: 'backlog', // Start in backlog, not pending
    priority: priorityMap[task.effort] || 2,
    category: task.groupName.replace(/^Group \d+: /, '').replace(/^Group [A-Z]: /, ''),
    skipTests: false,
    planningMode: 'lite',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [`prompt-${task.promptNumber}`, task.effort.toLowerCase()],
    order: index,
    dependencies: dependencies.length > 0 ? dependencies : undefined,
  };
}

/**
 * Calculate task dependencies based on logical order
 */
function calculateDependencies(task, allTasks) {
  const dependencies = [];
  const taskNum = parseInt(task.taskId.match(/P\d+-(\d+)/)[1]);
  const promptNum = task.promptNumber;
  
  // Rule 1: Prompt 2 depends on Prompt 1 completion
  if (promptNum === 2 && taskNum === 1) {
    const lastP1Task = allTasks.find(t => t.promptNumber === 1 && t.taskId.match(/P1-110/));
    if (lastP1Task) {
      dependencies.push(generateFeatureId(lastP1Task.taskId, lastP1Task.description));
    }
  }
  
  // Rule 2: Prompt 3 depends on Prompt 2 completion
  if (promptNum === 3 && taskNum === 1) {
    const lastP2Task = allTasks.find(t => t.promptNumber === 2 && t.taskId.match(/P2-093/));
    if (lastP2Task) {
      dependencies.push(generateFeatureId(lastP2Task.taskId, lastP2Task.description));
    }
  }
  
  // Rule 3: Within same group, depend on previous task (sequential)
  if (taskNum > 1) {
    const prevTaskId = `P${promptNum}-${String(taskNum - 1).padStart(3, '0')}`;
    const prevTask = allTasks.find(t => t.taskId === prevTaskId);
    if (prevTask && prevTask.groupName === task.groupName) {
      dependencies.push(generateFeatureId(prevTask.taskId, prevTask.description));
    }
  }
  
  // Rule 4: Models must complete before API endpoints
  if (task.description.match(/^Create `?api\//i)) {
    const modelTasks = allTasks.filter(t => 
      t.promptNumber === promptNum &&
      t.description.match(/^Create `?(models|schemas)\//i) &&
      parseInt(t.taskId.match(/P\d+-(\d+)/)[1]) < taskNum
    );
    modelTasks.forEach(mt => {
      const depId = generateFeatureId(mt.taskId, mt.description);
      if (!dependencies.includes(depId)) {
        dependencies.push(depId);
      }
    });
  }
  
  return dependencies;
}

/**
 * Write feature to AutoMaker directory
 */
async function writeFeature(feature) {
  const featureDir = path.join(CONFIG.featuresDir, feature.id);
  await fs.mkdir(featureDir, { recursive: true });
  
  const featurePath = path.join(featureDir, 'feature.json');
  await fs.writeFile(featurePath, JSON.stringify(feature, null, 2));
  
  // Create empty agent-output.md
  const outputPath = path.join(featureDir, 'agent-output.md');
  await fs.writeFile(outputPath, `# Agent Output: ${feature.title}\n\n_No output yet_\n`);
  
  return featurePath;
}

/**
 * Main import function
 */
async function importTodos() {
  console.log('🚀 AutoMaker Todo Import\n');
  console.log(`📁 Project: ${PROJECT_ROOT}`);
  console.log(`📂 Todos: ${CONFIG.todosDir}`);
  console.log(`📂 AutoMaker: ${CONFIG.automakerDir}\n`);
  
  // Ensure directories exist
  await fs.mkdir(CONFIG.featuresDir, { recursive: true });
  
  // Find all todo files
  const todoFiles = await fs.readdir(CONFIG.todosDir);
  const mdFiles = todoFiles.filter(f => f.endsWith('.md')).sort(); // Sort to ensure P1, P2, P3 order
  
  console.log(`📄 Found ${mdFiles.length} todo files\n`);
  
  // First pass: collect ALL tasks to calculate dependencies
  const allTasks = [];
  for (const file of mdFiles) {
    const filePath = path.join(CONFIG.todosDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const tasks = extractTasksFromMarkdown(content, file);
    allTasks.push(...tasks);
  }
  
  console.log(`📊 Total tasks: ${allTasks.length}`);
  console.log(`📋 Calculating dependencies...\n`);
  
  let importedCount = 0;
  const errors = [];
  
  // Second pass: create features with dependencies
  for (const file of mdFiles) {
    const filePath = path.join(CONFIG.todosDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    
    console.log(`\n📑 Processing: ${file}`);
    
    const tasks = extractTasksFromMarkdown(content, file);
    console.log(`   Found ${tasks.length} tasks`);
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      try {
        const feature = taskToFeature(task, importedCount, allTasks);
        await writeFeature(feature);
        importedCount++;
        
        if ((i + 1) % 20 === 0) {
          console.log(`   ✓ Imported ${i + 1}/${tasks.length} tasks`);
        }
      } catch (error) {
        errors.push({ task, error: error.message });
        console.error(`   ✗ Failed: ${task.taskId} - ${error.message}`);
      }
    }
    
    console.log(`   ✅ Imported ${tasks.length} tasks from ${file}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Import Complete!`);
  console.log(`   Total tasks: ${allTasks.length}`);
  console.log(`   Successfully imported: ${importedCount}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`\n📁 Features written to: ${CONFIG.featuresDir}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    for (const { task, error } of errors) {
      console.log(`   - ${task.taskId}: ${error}`);
    }
  }
  
  console.log('\n🎉 Open AutoMaker and load this project to see your tasks!');
  console.log(`   Project path: ${PROJECT_ROOT}`);
  console.log('\n📌 Features are now in BACKLOG with dependencies set.');
  console.log('   Move tasks to "In Progress" when ready to start.');
  
  return { totalTasks: allTasks.length, importedCount, errors };
}

// CLI execution
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node import-to-automaker.mjs [options]

Options:
  --help, -h     Show this help
  --dry-run      Parse and show tasks without importing

This script imports tasks from Refactor/todos/*.md into AutoMaker.
`);
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 Dry run mode - no files will be written\n');
  
  const todoFiles = await fs.readdir(CONFIG.todosDir);
  for (const file of todoFiles.filter(f => f.endsWith('.md'))) {
    const content = await fs.readFile(path.join(CONFIG.todosDir, file), 'utf-8');
    const tasks = extractTasksFromMarkdown(content, file);
    console.log(`\n${file}: ${tasks.length} tasks`);
    tasks.slice(0, 5).forEach(t => console.log(`  - [${t.taskId}] ${t.description}`));
    if (tasks.length > 5) console.log(`  ... and ${tasks.length - 5} more`);
  }
} else {
  importTodos().catch(console.error);
}
