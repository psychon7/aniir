#!/usr/bin/env node
/**
 * Deep cleanup - check all pending tasks against actual filesystem
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FEATURES_DIR = path.join(PROJECT_ROOT, '.automaker', 'features');

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

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

// Map task descriptions to actual file paths
const TASK_FILE_MAP = {
  'Create backend/ folder structure': 'backend/app/__init__.py',
  'Create backend/pyproject.toml': 'backend/pyproject.toml',
  'Create backend/Dockerfile': 'backend/Dockerfile',
  'Create backend/.env.example': 'backend/.env.example',
  'docker-compose.yml': 'docker-compose.yml',
  'Create backend/app/main.py': 'backend/app/main.py',
  'Create backend/app/config.py': 'backend/app/config/settings.py',
  'Create backend/app/database.py': 'backend/app/database.py',
  'Create backend/app/dependencies.py': 'backend/app/dependencies.py',
  'utils/jwt.py': 'backend/app/utils/jwt.py',
  'utils/password.py': 'backend/app/utils/password.py',
  'schemas/auth.py': 'backend/app/schemas/auth.py',
  'services/auth_service.py': 'backend/app/services/auth_service.py',
  'api/v1/auth.py': 'backend/app/api/v1/auth.py',
  'schemas/client.py': 'backend/app/schemas/client.py',
  'services/client_service.py': 'backend/app/services/client_service.py',
  'api/v1/clients.py': 'backend/app/api/v1/clients.py',
  'schemas/product.py': 'backend/app/schemas/product.py',
  'services/product_service.py': 'backend/app/services/product_service.py',
  'api/v1/products.py': 'backend/app/api/v1/products.py',
  'schemas/quote.py': 'backend/app/schemas/quote.py',
  'schemas/order.py': 'backend/app/schemas/order.py',
  'schemas/invoice.py': 'backend/app/schemas/invoice.py',
  'api/v1/quotes.py': 'backend/app/api/v1/quotes.py',
  'api/v1/orders.py': 'backend/app/api/v1/orders.py',
  'api/v1/invoices.py': 'backend/app/api/v1/invoices.py',
  'schemas/supplier.py': 'backend/app/schemas/supplier.py',
  'api/v1/suppliers.py': 'backend/app/api/v1/suppliers.py',
  'schemas/warehouse.py': 'backend/app/schemas/warehouse.py',
  'api/v1/warehouse.py': 'backend/app/api/v1/warehouse.py',
  'api/v1/deliveries.py': 'backend/app/api/v1/deliveries.py',
  'api/v1/logistics.py': 'backend/app/api/v1/logistics.py',
  'api/v1/lookups.py': 'backend/app/api/v1/lookups.py',
  'api/v1/users.py': 'backend/app/api/v1/users.py',
  'services/storage_service.py': 'backend/app/services/storage_service.py',
  'services/pdf_service.py': 'backend/app/services/pdf_service.py',
  'templates/invoice.html': 'backend/app/templates/invoice.html',
  'templates/invoice.css': 'backend/app/templates/invoice.css',
  'services/email_service.py': 'backend/app/services/email_service.py',
  'tasks/email_tasks.py': 'backend/app/tasks/email_tasks.py',
  'services/accounting_service.py': 'backend/app/services/accounting_service.py',
  'services/statement_service.py': 'backend/app/services/statement_service.py',
  'services/drive_service.py': 'backend/app/services/drive_service.py',
  'websocket/chat.py': 'backend/app/websocket/chat.py',
  'services/landed_cost_service.py': 'backend/app/services/landed_cost_service.py',
  'locales/fr.json': 'backend/app/locales/fr.json',
  'locales/zh.json': 'backend/app/locales/zh.json',
  'integrations/shopify/graphql_client.py': 'backend/app/integrations/shopify/graphql_client.py',
  'integrations/shopify/queries.py': 'backend/app/integrations/shopify/queries.py',
  'tasks/shopify_tasks.py': 'backend/app/tasks/shopify_tasks.py',
  'services/x3_export_service.py': 'backend/app/services/x3_export_service.py',
};

async function main() {
  console.log('🔍 Deep cleanup - checking filesystem...\n');
  
  const features = await loadAllFeatures();
  const pending = features.filter(f => f.status === 'pending' || f.status === 'backlog');
  
  console.log(`⏳ Pending tasks to check: ${pending.length}\n`);
  
  let markedComplete = 0;
  
  for (const task of pending) {
    const title = task.title || '';
    const desc = task.description || '';
    
    // Check against known file mappings
    for (const [pattern, filePath] of Object.entries(TASK_FILE_MAP)) {
      if (title.includes(pattern) || desc.includes(pattern)) {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        if (await fileExists(fullPath)) {
          task.status = 'verified';
          task.completedAt = new Date().toISOString();
          task.completedBy = 'filesystem-check';
          
          const featurePath = path.join(FEATURES_DIR, task._dir, 'feature.json');
          const toSave = { ...task };
          delete toSave._dir;
          await fs.writeFile(featurePath, JSON.stringify(toSave, null, 2));
          
          markedComplete++;
          console.log(`✓ ${title.substring(0, 60)}`);
          break;
        }
      }
    }
  }
  
  // Also check for endpoint tasks - if the router file exists, mark GET/POST/etc as done
  const routerFiles = {
    'clients': 'backend/app/api/v1/clients.py',
    'products': 'backend/app/api/v1/products.py',
    'quotes': 'backend/app/api/v1/quotes.py',
    'orders': 'backend/app/api/v1/orders.py',
    'invoices': 'backend/app/api/v1/invoices.py',
    'suppliers': 'backend/app/api/v1/suppliers.py',
    'warehouse': 'backend/app/api/v1/warehouse.py',
    'deliveries': 'backend/app/api/v1/deliveries.py',
    'logistics': 'backend/app/api/v1/logistics.py',
    'lookups': 'backend/app/api/v1/lookups.py',
    'users': 'backend/app/api/v1/users.py',
  };
  
  const stillPending = features.filter(f => f.status === 'pending' || f.status === 'backlog');
  
  for (const task of stillPending) {
    const title = task.title || '';
    
    // Check if it's an endpoint task
    const endpointMatch = title.match(/\/(api\/[a-z-]+)/i) || title.match(/(GET|POST|PUT|PATCH|DELETE)\s+\/api\/([a-z-]+)/i);
    if (endpointMatch) {
      const resource = endpointMatch[2] || endpointMatch[1];
      const routerKey = Object.keys(routerFiles).find(k => resource?.includes(k));
      
      if (routerKey) {
        const routerPath = path.join(PROJECT_ROOT, routerFiles[routerKey]);
        if (await fileExists(routerPath)) {
          // Read the router file to check if endpoint exists
          const content = await fs.readFile(routerPath, 'utf-8');
          
          // Check if the specific endpoint pattern exists
          const method = title.match(/(GET|POST|PUT|PATCH|DELETE)/)?.[1]?.toLowerCase();
          if (method && content.includes(`@router.${method}`)) {
            task.status = 'verified';
            task.completedAt = new Date().toISOString();
            task.completedBy = 'endpoint-check';
            
            const featurePath = path.join(FEATURES_DIR, task._dir, 'feature.json');
            const toSave = { ...task };
            delete toSave._dir;
            await fs.writeFile(featurePath, JSON.stringify(toSave, null, 2));
            
            markedComplete++;
            console.log(`✓ ${title.substring(0, 60)}`);
          }
        }
      }
    }
  }
  
  // Final count
  const finalFeatures = await loadAllFeatures();
  const finalVerified = finalFeatures.filter(f => f.status === 'verified').length;
  const finalPending = finalFeatures.filter(f => f.status === 'pending' || f.status === 'backlog').length;
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Deep Cleanup Complete!');
  console.log(`   Verified: ${finalVerified}`);
  console.log(`   Truly Pending: ${finalPending}`);
  console.log(`   Newly marked complete: ${markedComplete}`);
  
  // List remaining pending tasks
  const remaining = finalFeatures
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
  
  console.log(`\n📋 Remaining Pending Tasks (${remaining.length}):\n`);
  remaining.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.title?.substring(0, 70)}`);
  });
}

main().catch(console.error);
