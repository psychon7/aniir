#!/usr/bin/env node
/**
 * Analyze AutoMaker tasks and reorganize with proper dependencies
 * 
 * Features:
 * 1. Analyze completed/in-progress/pending/backlog tasks
 * 2. Generate dependency graph (Mermaid format)
 * 3. Reorganize backlog with priority order
 * 4. Set default model to OpenAI Codex CLI (GPT-5.2)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FEATURES_DIR = path.join(PROJECT_ROOT, '.automaker', 'features');

// Priority order for task groups
const GROUP_PRIORITY = {
  'Project Scaffold': 1,
  'Reference Table Models': 2,
  'Master Table Models': 3,
  'Auth Service': 4,
  'Clients': 5,
  'Products': 6,
  'Quotes': 7,
  'Orders': 7,
  'Invoices': 7,
  'Suppliers': 8,
  'Warehouse': 8,
  'Logistics': 8,
  'Lookups': 9,
  'Users': 9,
  'Integration Testing': 10,
  'PDF Generation': 11,
  'Email Service': 12,
  'Accounting': 13,
  'Drive': 14,
  'Chat': 15,
  'Landed Cost': 16,
  'Shopify': 17,
  'Sage X3': 18,
  'SuperPDP': 19,
};

/**
 * Load all features from disk
 */
async function loadAllFeatures() {
  const features = [];
  const dirs = await fs.readdir(FEATURES_DIR);
  
  for (const dir of dirs) {
    const featurePath = path.join(FEATURES_DIR, dir, 'feature.json');
    try {
      const content = await fs.readFile(featurePath, 'utf-8');
      const feature = JSON.parse(content);
      feature._dir = dir;
      features.push(feature);
    } catch (e) {
      // Skip invalid features
    }
  }
  
  return features;
}

/**
 * Extract task number from ID (e.g., "p1-001-xxx" -> 1)
 */
function getTaskNumber(id) {
  const match = id.match(/p(\d+)-(\d+)/);
  if (match) {
    return { prompt: parseInt(match[1]), task: parseInt(match[2]) };
  }
  return { prompt: 0, task: 0 };
}

/**
 * Calculate proper dependencies for a task
 */
function calculateDependencies(feature, allFeatures) {
  const deps = [];
  const { prompt, task } = getTaskNumber(feature.id);
  
  // Rule 1: First task of Prompt 2 depends on last task of Prompt 1
  if (prompt === 2 && task === 1) {
    const p1Tasks = allFeatures.filter(f => getTaskNumber(f.id).prompt === 1);
    const lastP1 = p1Tasks.sort((a, b) => getTaskNumber(b.id).task - getTaskNumber(a.id).task)[0];
    if (lastP1) deps.push(lastP1.id);
  }
  
  // Rule 2: First task of Prompt 3 depends on last task of Prompt 2
  if (prompt === 3 && task === 1) {
    const p2Tasks = allFeatures.filter(f => getTaskNumber(f.id).prompt === 2);
    const lastP2 = p2Tasks.sort((a, b) => getTaskNumber(b.id).task - getTaskNumber(a.id).task)[0];
    if (lastP2) deps.push(lastP2.id);
  }
  
  // Rule 3: Sequential within same prompt (task N depends on task N-1)
  if (task > 1) {
    const prevTaskNum = String(task - 1).padStart(3, '0');
    const prevId = `p${prompt}-${prevTaskNum}`;
    const prevFeature = allFeatures.find(f => f.id.startsWith(prevId));
    if (prevFeature) deps.push(prevFeature.id);
  }
  
  return deps;
}

/**
 * Calculate priority based on group and effort
 */
function calculatePriority(feature) {
  const category = feature.category || '';
  let basePriority = 50;
  
  for (const [group, priority] of Object.entries(GROUP_PRIORITY)) {
    if (category.toLowerCase().includes(group.toLowerCase())) {
      basePriority = priority;
      break;
    }
  }
  
  // Adjust by effort
  const effortBonus = {
    'large': -2,
    'medium': 0,
    'small': 2,
  };
  
  const effort = (feature.tags || []).find(t => ['large', 'medium', 'small'].includes(t)) || 'medium';
  
  return basePriority + (effortBonus[effort] || 0);
}

/**
 * Generate Mermaid dependency graph
 */
function generateMermaidGraph(features) {
  const lines = ['```mermaid', 'flowchart TD'];
  
  // Group by status
  const byStatus = {
    completed: [],
    in_progress: [],
    pending: [],
    backlog: [],
  };
  
  features.forEach(f => {
    const status = f.status || 'backlog';
    if (byStatus[status]) byStatus[status].push(f);
  });
  
  // Add subgraphs for each status
  lines.push('  subgraph Completed');
  byStatus.completed.forEach(f => {
    const label = f.id.split('-').slice(0, 2).join('-');
    lines.push(`    ${f.id.replace(/-/g, '_')}[${label}]:::completed`);
  });
  lines.push('  end');
  
  lines.push('  subgraph InProgress');
  byStatus.in_progress.forEach(f => {
    const label = f.id.split('-').slice(0, 2).join('-');
    lines.push(`    ${f.id.replace(/-/g, '_')}[${label}]:::inprogress`);
  });
  lines.push('  end');
  
  lines.push('  subgraph Pending');
  byStatus.pending.slice(0, 30).forEach(f => {
    const label = f.id.split('-').slice(0, 2).join('-');
    lines.push(`    ${f.id.replace(/-/g, '_')}[${label}]:::pending`);
  });
  if (byStatus.pending.length > 30) {
    lines.push(`    pending_more[...${byStatus.pending.length - 30} more]:::pending`);
  }
  lines.push('  end');
  
  lines.push('  subgraph Backlog');
  byStatus.backlog.slice(0, 20).forEach(f => {
    const label = f.id.split('-').slice(0, 2).join('-');
    lines.push(`    ${f.id.replace(/-/g, '_')}[${label}]:::backlog`);
  });
  if (byStatus.backlog.length > 20) {
    lines.push(`    backlog_more[...${byStatus.backlog.length - 20} more]:::backlog`);
  }
  lines.push('  end');
  
  // Add dependency edges (limited to avoid clutter)
  const allWithDeps = features.filter(f => f.dependencies?.length > 0).slice(0, 50);
  allWithDeps.forEach(f => {
    (f.dependencies || []).forEach(dep => {
      const fromNode = dep.replace(/-/g, '_');
      const toNode = f.id.replace(/-/g, '_');
      lines.push(`  ${fromNode} --> ${toNode}`);
    });
  });
  
  // Add styles
  lines.push('  classDef completed fill:#10b981,stroke:#059669,color:#fff');
  lines.push('  classDef inprogress fill:#f59e0b,stroke:#d97706,color:#fff');
  lines.push('  classDef pending fill:#3b82f6,stroke:#2563eb,color:#fff');
  lines.push('  classDef backlog fill:#6b7280,stroke:#4b5563,color:#fff');
  lines.push('```');
  
  return lines.join('\n');
}

/**
 * Update feature with new dependencies and model
 */
async function updateFeature(feature, allFeatures) {
  const featurePath = path.join(FEATURES_DIR, feature._dir, 'feature.json');
  
  // Calculate new dependencies
  const newDeps = calculateDependencies(feature, allFeatures);
  
  // Calculate priority
  const newPriority = calculatePriority(feature);
  
  // Set model to OpenAI Codex CLI (gpt-5.1-codex)
  const updated = {
    ...feature,
    dependencies: newDeps.length > 0 ? newDeps : undefined,
    priority: newPriority,
    model: 'gpt-5.1-codex',
    modelProvider: 'openai',
    planningMode: 'lite',
  };
  
  delete updated._dir;
  
  await fs.writeFile(featurePath, JSON.stringify(updated, null, 2));
  return updated;
}

/**
 * Main analysis and reorganization
 */
async function main() {
  console.log('🔍 Analyzing AutoMaker Tasks\n');
  console.log(`📁 Features: ${FEATURES_DIR}\n`);
  
  // Load all features
  const features = await loadAllFeatures();
  console.log(`📊 Total features: ${features.length}\n`);
  
  // Count by status
  const byStatus = {};
  features.forEach(f => {
    const status = f.status || 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  
  console.log('📈 Status Summary:');
  Object.entries(byStatus).forEach(([status, count]) => {
    const emoji = {
      completed: '✅',
      in_progress: '🔄',
      pending: '⏳',
      backlog: '📋',
    }[status] || '❓';
    console.log(`   ${emoji} ${status}: ${count}`);
  });
  
  // Separate by status (verified = completed in AutoMaker)
  const completed = features.filter(f => f.status === 'completed' || f.status === 'verified');
  const inProgress = features.filter(f => f.status === 'in_progress' || f.status === 'running');
  const pending = features.filter(f => f.status === 'pending');
  const backlog = features.filter(f => f.status === 'backlog');
  
  console.log('\n🔄 In Progress Tasks:');
  inProgress.forEach(f => console.log(`   - ${f.title?.substring(0, 60)}`));
  
  console.log('\n✅ Completed Tasks:');
  completed.forEach(f => console.log(`   - ${f.title?.substring(0, 60)}`));
  
  // Update pending and backlog tasks with proper dependencies
  console.log('\n📝 Updating dependencies and model for pending/backlog tasks...');
  
  let updatedCount = 0;
  const toUpdate = [...pending, ...backlog];
  
  for (const feature of toUpdate) {
    try {
      await updateFeature(feature, features);
      updatedCount++;
    } catch (e) {
      console.error(`   ✗ Failed to update ${feature.id}: ${e.message}`);
    }
  }
  
  console.log(`   ✓ Updated ${updatedCount} features`);
  
  // Generate dependency graph
  console.log('\n📊 Generating dependency graph...');
  const graph = generateMermaidGraph(features);
  
  const graphPath = path.join(PROJECT_ROOT, 'TASK-DEPENDENCY-GRAPH.md');
  await fs.writeFile(graphPath, `# Task Dependency Graph

Generated: ${new Date().toISOString()}

## Summary

| Status | Count |
|--------|-------|
| ✅ Completed | ${completed.length} |
| 🔄 In Progress | ${inProgress.length} |
| ⏳ Pending | ${pending.length} |
| 📋 Backlog | ${backlog.length} |
| **Total** | **${features.length}** |

## Dependency Graph

${graph}

## Task List by Priority

### Prompt 1: Foundation (${features.filter(f => f.id.startsWith('p1-')).length} tasks)

${features.filter(f => f.id.startsWith('p1-')).sort((a, b) => getTaskNumber(a.id).task - getTaskNumber(b.id).task).map(f => `- [${f.status === 'completed' ? 'x' : ' '}] ${f.title?.substring(0, 70)}`).join('\n')}

### Prompt 2: Features (${features.filter(f => f.id.startsWith('p2-')).length} tasks)

${features.filter(f => f.id.startsWith('p2-')).sort((a, b) => getTaskNumber(a.id).task - getTaskNumber(b.id).task).map(f => `- [${f.status === 'completed' ? 'x' : ' '}] ${f.title?.substring(0, 70)}`).join('\n')}

### Prompt 3: Integrations (${features.filter(f => f.id.startsWith('p3-')).length} tasks)

${features.filter(f => f.id.startsWith('p3-')).sort((a, b) => getTaskNumber(a.id).task - getTaskNumber(b.id).task).map(f => `- [${f.status === 'completed' ? 'x' : ' '}] ${f.title?.substring(0, 70)}`).join('\n')}

## Model Configuration

All tasks updated to use:
- **Model**: OpenAI GPT-5.2
- **Provider**: openai-codex-cli
- **Planning Mode**: lite
`);
  
  console.log(`   ✓ Graph saved to: ${graphPath}`);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Analysis Complete!');
  console.log(`   - Completed: ${completed.length} (preserved)`);
  console.log(`   - In Progress: ${inProgress.length} (preserved)`);
  console.log(`   - Pending: ${pending.length} (updated with deps)`);
  console.log(`   - Backlog: ${backlog.length} (updated with deps)`);
  console.log(`\n📊 View graph: ${graphPath}`);
  console.log('\n🤖 Model set to: OpenAI GPT-5.2 (openai-codex-cli)');
}

main().catch(console.error);
