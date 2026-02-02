#!/usr/bin/env node
/**
 * Clean up duplicate/conflicting tasks
 * 
 * This script:
 * 1. Identifies verified (completed) tasks
 * 2. Removes pending tasks that duplicate verified work
 * 3. Ensures only truly pending tasks remain
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FEATURES_DIR = path.join(PROJECT_ROOT, '.automaker', 'features');

async function loadAllFeatures() {
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

function extractTaskId(id) {
  const match = id.match(/p(\d+)-(\d+)/);
  return match ? `P${match[1]}-${match[2].padStart(3, '0')}` : null;
}

async function main() {
  console.log('🔍 Analyzing tasks for duplicates...\n');
  
  const features = await loadAllFeatures();
  
  // Separate by status
  const verified = features.filter(f => f.status === 'verified');
  const pending = features.filter(f => f.status === 'pending' || f.status === 'backlog');
  
  console.log(`✅ Verified tasks: ${verified.length}`);
  console.log(`⏳ Pending/Backlog tasks: ${pending.length}`);
  
  // Get verified task IDs (normalized)
  const verifiedTaskIds = new Set(
    verified.map(f => extractTaskId(f.id)).filter(Boolean)
  );
  
  console.log(`\n📋 Verified task IDs: ${verifiedTaskIds.size}`);
  
  // Find pending tasks that are actually already done
  const duplicates = [];
  const trulyPending = [];
  
  for (const task of pending) {
    const taskId = extractTaskId(task.id);
    if (verifiedTaskIds.has(taskId)) {
      duplicates.push(task);
    } else {
      trulyPending.push(task);
    }
  }
  
  console.log(`\n🔄 Duplicate tasks (already verified): ${duplicates.length}`);
  console.log(`📝 Truly pending tasks: ${trulyPending.length}`);
  
  if (duplicates.length > 0) {
    console.log('\n🗑️  Removing duplicate tasks...');
    
    for (const task of duplicates) {
      const taskDir = path.join(FEATURES_DIR, task._dir);
      try {
        await fs.rm(taskDir, { recursive: true });
        console.log(`   ✓ Removed: ${task.title?.substring(0, 50)}`);
      } catch (e) {
        console.log(`   ✗ Failed to remove: ${task._dir}`);
      }
    }
  }
  
  // Also check for tasks where the file already exists
  console.log('\n🔍 Checking if pending tasks have already been implemented...');
  
  let alreadyDone = 0;
  for (const task of trulyPending) {
    const title = task.title || '';
    
    // Extract file path from task title
    const fileMatch = title.match(/Create\s+[`"]?([^`"]+\.(py|ts|tsx|json|sql|md|html|css))[`"]?/i);
    if (fileMatch) {
      const filePath = fileMatch[1];
      const fullPath = path.join(PROJECT_ROOT, filePath.replace(/^backend\//, 'backend/'));
      
      try {
        await fs.access(fullPath);
        // File exists - mark as verified
        task.status = 'verified';
        task.completedAt = new Date().toISOString();
        task.completedBy = 'pre-existing';
        
        const featurePath = path.join(FEATURES_DIR, task._dir, 'feature.json');
        const toSave = { ...task };
        delete toSave._dir;
        await fs.writeFile(featurePath, JSON.stringify(toSave, null, 2));
        
        alreadyDone++;
        console.log(`   ✓ Already exists: ${filePath}`);
      } catch (e) {
        // File doesn't exist - truly pending
      }
    }
  }
  
  console.log(`\n📊 Tasks marked as already done: ${alreadyDone}`);
  
  // Final count
  const finalFeatures = await loadAllFeatures();
  const finalVerified = finalFeatures.filter(f => f.status === 'verified').length;
  const finalPending = finalFeatures.filter(f => f.status === 'pending' || f.status === 'backlog').length;
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Cleanup Complete!');
  console.log(`   Verified: ${finalVerified}`);
  console.log(`   Pending: ${finalPending}`);
  console.log(`   Removed duplicates: ${duplicates.length}`);
  console.log(`   Marked as pre-existing: ${alreadyDone}`);
}

main().catch(console.error);
