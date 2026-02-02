# Re-import Tasks with Dependencies

## ⚠️ Current Issue

Tasks were imported **without dependencies**, causing:
- ❌ Tasks running in wrong order
- ❌ No blocking between dependent tasks
- ❌ All tasks in "pending" instead of "backlog"

## ✅ Fixed Script

The script now adds:
- **Sequential dependencies** within groups (P1-002 depends on P1-001)
- **Cross-prompt dependencies** (Prompt 2 waits for Prompt 1, Prompt 3 waits for Prompt 2)
- **Model-before-API** dependencies (API endpoints wait for models)
- **Backlog status** (tasks start in backlog, not auto-running)

## 🔧 Steps to Re-import

### 1. Stop Running Agents in AutoMaker
In AutoMaker UI:
- Click "Running Agents" (bottom left, shows "10")
- Stop all running agents
- Or close AutoMaker entirely

### 2. Clear Old Features
```bash
cd /Users/mohankumarv/Desktop/Projects/Clients/AXTECH/ERP2025

# Backup existing (optional)
mv .automaker/features .automaker/features.backup

# Or delete
rm -rf .automaker/features
```

### 3. Re-import with Dependencies
```bash
node scripts/import-to-automaker.mjs
```

### 4. Verify in AutoMaker
- Open AutoMaker
- Load project: `/Users/mohankumarv/Desktop/Projects/Clients/AXTECH/ERP2025`
- Check Kanban Board:
  - All tasks should be in **Backlog**
  - Click a task → see "Dependencies" section
  - Tasks should be blocked until dependencies complete

## 📊 Dependency Rules Applied

1. **Within-group sequential**: P1-002 → P1-001, P1-003 → P1-002, etc.
2. **Cross-prompt blocking**: 
   - P2-001 waits for P1-110 (last Prompt 1 task)
   - P3-001 waits for P2-093 (last Prompt 2 task)
3. **Model dependencies**: API endpoints wait for their models/schemas
4. **Status**: All start in `backlog` (not auto-running)

## 🎯 Workflow After Re-import

1. **Start with Prompt 1 foundation tasks**
   - Move P1-001 to "In Progress" → agent starts
   - P1-002 will auto-unblock when P1-001 completes
   
2. **Parallel execution within groups**
   - Different groups (Agent 1, Agent 2, etc.) can run in parallel
   - Tasks within same group run sequentially

3. **Prompt 2 & 3 auto-unblock**
   - When P1-110 completes → P2-001 unblocks
   - When P2-093 completes → P3-001 unblocks

## 🔍 Verify Dependencies

Check a task's dependencies:
```bash
# Example: Check P1-002 dependencies
cat .automaker/features/p1-002-*/feature.json | grep -A5 dependencies
```

Should show:
```json
"dependencies": ["p1-001-1a75b5ed"]
```
