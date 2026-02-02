# ERP2025 AI Copilot - Enterprise Implementation Plan

**Version:** 1.0.0
**Created:** 2026-02-02
**Status:** Architecture Design
**Integration:** Extends existing FastAPI + React + RBAC system

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Database Schema Design](#3-database-schema-design)
4. [Backend Implementation](#4-backend-implementation)
5. [Frontend Implementation](#5-frontend-implementation)
6. [Tool Registry & Manifest](#6-tool-registry--manifest)
7. [Security & RBAC Integration](#7-security--rbac-integration)
8. [Generative UI with Tambo](#8-generative-ui-with-tambo)
9. [Streaming Architecture](#9-streaming-architecture)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Testing Strategy](#11-testing-strategy)
12. [Production Considerations](#12-production-considerations)

---

## 1. Executive Summary

### 1.1 Vision

Build a **Claude-like AI Copilot** integrated into the ERP2025 system that enables users to:
- Execute any CRUD operation via natural language
- Get intelligent insights from data (charts, reports, analytics)
- Automate multi-step workflows (send invoices, create POs, sync Shopify)
- Receive context-aware assistance based on current view
- See generative UI (tables, charts, forms) rendered inline via **Tambo**

### 1.2 Core Capabilities

| Capability | Example User Request |
|------------|---------------------|
| **CRUD Operations** | "Create a product for LED strip 5M, category Lighting, price €45" |
| **Multi-Entity Actions** | "Generate invoice PDF for INV-2024-001, email to customer, CC accountant" |
| **Analytics & Insights** | "Show me overdue invoices by aging bucket with a chart" |
| **Workflow Automation** | "Allocate landed cost for lot L-2024-035 by weight and show cost per SKU" |
| **Integration Commands** | "Sync Shopify orders from last 7 days and create delivery notes" |
| **Data Export** | "Export all paid invoices from January to X3 format as ZIP" |

### 1.3 Technical Foundation

**Leverages Existing Architecture:**
- ✅ **FastAPI Service Layer** - 43 existing services with DI pattern
- ✅ **React + TanStack Query** - Established hooks and API patterns
- ✅ **SQLAlchemy Models** - 48 existing models with relationships
- ✅ **RBAC System** - TR_ROL_Role, TR_RIT_Right (348 permissions)
- ✅ **Integrations** - Shopify, Email (SMTP/SES), PDF generation, Celery tasks

**New Components:**
- 🆕 **CopilotService** - Agent orchestration and tool execution
- 🆕 **Tool Registry** - Declarative tool manifest with permissions
- 🆕 **Streaming API** - SSE for real-time token/tool events
- 🆕 **Tambo Components** - Registered UI blocks for generative rendering
- 🆕 **Approval Flow** - Confirmation gates for side-effect operations

### 1.4 Key Benefits

- **80%+ Task Coverage**: Most ERP operations achievable via chat
- **Role-Based Tools**: Different capabilities per user role
- **Full Audit Trail**: Every tool call logged with user/timestamp/result
- **Safety Gates**: No destructive actions without explicit confirmation
- **Context Awareness**: Copilot knows current route/entity/selection
- **Scalable Architecture**: Easy to add new tools following established patterns

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Copilot Side Panel Component               │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ 1. Context Header (Company/BU/Route/Entity)            │    │
│  │ 2. Message Thread (User + Assistant + Tambo UI Blocks) │    │
│  │ 3. Tool Call Timeline (planned → running → complete)   │    │
│  │ 4. Input Area (text + attachments + quick actions)     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Tambo Component  │  │  API Client      │                    │
│  │  Registry         │  │  (Axios + SSE)   │                    │
│  │  - ActionCard     │  │  - /copilot/chat │                    │
│  │  - DataTable      │  │  - /copilot/stream                   │
│  │  - ChartCard      │  │  - /copilot/confirm                  │
│  │  - EmailDraft     │  └──────────────────┘                    │
│  │  - FormWizard     │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / SSE
┌──────────────────────────┴──────────────────────────────────────┐
│                    BACKEND (FastAPI + Python)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  /api/v1/copilot                        │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ POST   /chat          → Start/continue conversation    │    │
│  │ GET    /stream        → SSE token/tool/UI stream       │    │
│  │ POST   /confirm       → Approve pending action         │    │
│  │ GET    /tools/manifest→ Tool catalog + permissions     │    │
│  │ GET    /history       → Past conversations             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              CopilotService (Agent Core)                │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ 1. ContextBuilder    → Route/entity/user/permissions   │    │
│  │ 2. AgentPlanner      → Message → Tool calls plan       │    │
│  │ 3. PolicyEngine      → Validate tool permissions       │    │
│  │ 4. ToolRunner        → Execute tools + handle errors   │    │
│  │ 5. UIComposer        → Map outputs → Tambo blocks      │    │
│  │ 6. EventStreamer     → SSE token/event emission        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   Tool Registry                         │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ Tool Definition Format:                                 │    │
│  │ - name: "products.create"                               │    │
│  │ - description: "Create a new product"                   │    │
│  │ - input_schema: JSON Schema                             │    │
│  │ - output_schema: JSON Schema                            │    │
│  │ - required_permissions: ["rit_create"]                  │    │
│  │ - side_effect_level: "draft|external|financial"         │    │
│  │ - handler: async callable                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │  Existing    │  │   External   │  │   Database       │      │
│  │  Services    │  │  Integrations│  │   (SQL Server)   │      │
│  │  (43 svcs)   │  │  - Shopify   │  │  - Copilot tables│      │
│  │              │  │  - Email     │  │  - Audit logs    │      │
│  │ - Client     │  │  - PDF       │  │  - Tool calls    │      │
│  │ - Invoice    │  │  - X3 Export │  │  - Approvals     │      │
│  │ - Order      │  │              │  └──────────────────┘      │
│  │ - Product    │  └──────────────┘                            │
│  │ - Payment    │                                               │
│  │ - Delivery   │                                               │
│  │ - etc...     │                                               │
│  └─────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Agent Loop Flow

```
User Message
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. CONTEXT BUILDING                                          │
│    - Extract: route, entity ID, user role, BU, society      │
│    - Load: recent actions, current data, permissions        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AGENT PLANNING (LLM Call #1)                             │
│    Input: system prompt + context + user message + tools    │
│    Output: Plan (text) + Tool calls (JSON)                  │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. POLICY VALIDATION                                         │
│    For each tool call:                                       │
│    - Check user has permission (RBAC query)                 │
│    - Determine side_effect_level                            │
│    - Tag as "auto" or "requires_confirmation"               │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CONFIRMATION GATE (if side effects)                      │
│    - Generate ActionCard UI block                           │
│    - Stream to frontend                                     │
│    - Wait for POST /confirm with approval                   │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. TOOL EXECUTION                                            │
│    - Run approved tools sequentially or parallel            │
│    - Handle errors + retries (idempotency)                  │
│    - Stream progress events (tool_started, tool_completed)  │
│    - Log to TM_TCL_Tool_Call_Log                            │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. RESPONSE GENERATION (LLM Call #2)                        │
│    Input: tool results + original question                  │
│    Output: Assistant message + UI blocks                    │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. UI COMPOSITION                                            │
│    - Map tool outputs to Tambo components                   │
│    - Generate DataTable/Chart/RecordPreview props           │
│    - Stream ui_block events                                 │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
 Frontend renders Tambo components + text
```

### 2.3 Component Responsibilities

#### Frontend Components

| Component | Responsibility |
|-----------|---------------|
| `<CopilotPanel />` | Main container, layout, state management |
| `<MessageThread />` | Render user/assistant messages + UI blocks |
| `<ToolTimeline />` | Show tool call status (pending/running/success/failed) |
| `<TamboRenderer />` | Dynamically render registered Tambo components |
| `<ActionCard />` | Confirmation gate for side effects |
| `<ContextHeader />` | Display current context (route/entity/BU) |
| `useCopilotChat()` | Hook for sending messages + SSE streaming |
| `useCopilotStream()` | Hook for consuming SSE events |

#### Backend Services

| Service | Responsibility |
|---------|---------------|
| `CopilotService` | Main agent orchestration, LLM calls, loop control |
| `ToolRegistry` | Tool registration, discovery, schema validation |
| `PolicyEngine` | Permission checking via RBAC integration |
| `ToolRunner` | Tool execution, error handling, idempotency |
| `UIComposer` | Map tool outputs → Tambo component props |
| `EventStreamer` | SSE stream management, event emission |
| `ContextBuilder` | Extract context from request + database |

---

## 3. Database Schema Design

### 3.1 New Tables

#### TM_CPC_Copilot_Conversation
```sql
CREATE TABLE TM_CPC_Copilot_Conversation (
    cpc_id INT IDENTITY(1,1) PRIMARY KEY,
    cpc_uuid VARCHAR(36) NOT NULL UNIQUE,              -- UUID for client-side reference
    cpc_title NVARCHAR(200),                           -- Auto-generated or user-set title
    cpc_context_route NVARCHAR(100),                   -- e.g., "/authenticated/invoices/123"
    cpc_context_entity_type NVARCHAR(50),              -- e.g., "invoice", "client", "product"
    cpc_context_entity_id INT,                         -- Entity ID if applicable
    cpc_context_json NVARCHAR(MAX),                    -- Full context snapshot (JSON)

    -- User/tenant info
    usr_id INT NOT NULL FOREIGN KEY REFERENCES TM_USR_User(usr_id),
    soc_id INT NOT NULL FOREIGN KEY REFERENCES TR_SOC_Society(soc_id),
    bu_id INT FOREIGN KEY REFERENCES TR_BU_BusinessUnit(bu_id),

    -- Metadata
    cpc_message_count INT DEFAULT 0,
    cpc_tool_call_count INT DEFAULT 0,
    cpc_status VARCHAR(20) DEFAULT 'active',           -- active, archived, deleted
    cpc_created_at DATETIME2 DEFAULT GETDATE(),
    cpc_updated_at DATETIME2 DEFAULT GETDATE(),

    INDEX idx_user_society (usr_id, soc_id),
    INDEX idx_created_at (cpc_created_at DESC)
);
```

#### TM_CPM_Copilot_Message
```sql
CREATE TABLE TM_CPM_Copilot_Message (
    cpm_id INT IDENTITY(1,1) PRIMARY KEY,
    cpm_uuid VARCHAR(36) NOT NULL UNIQUE,
    cpc_id INT NOT NULL FOREIGN KEY REFERENCES TM_CPC_Copilot_Conversation(cpc_id) ON DELETE CASCADE,

    -- Message data
    cpm_role VARCHAR(20) NOT NULL,                     -- 'user', 'assistant', 'system', 'tool'
    cpm_content NVARCHAR(MAX),                         -- Text content
    cpm_content_type VARCHAR(20) DEFAULT 'text',       -- 'text', 'ui_block', 'tool_result'

    -- Tool call reference (if role='tool')
    tcl_id INT FOREIGN KEY REFERENCES TM_TCL_Tool_Call_Log(tcl_id),

    -- UI blocks (JSON array of Tambo component props)
    cpm_ui_blocks NVARCHAR(MAX),

    -- Metadata
    cpm_token_count INT,
    cpm_created_at DATETIME2 DEFAULT GETDATE(),

    INDEX idx_conversation (cpc_id, cpm_created_at),
    INDEX idx_role (cpm_role)
);
```

#### TM_TCL_Tool_Call_Log
```sql
CREATE TABLE TM_TCL_Tool_Call_Log (
    tcl_id INT IDENTITY(1,1) PRIMARY KEY,
    tcl_uuid VARCHAR(36) NOT NULL UNIQUE,
    cpc_id INT NOT NULL FOREIGN KEY REFERENCES TM_CPC_Copilot_Conversation(cpc_id),

    -- Tool identification
    tcl_tool_name VARCHAR(100) NOT NULL,               -- e.g., "products.create"
    tcl_tool_version VARCHAR(20),                      -- Tool schema version

    -- Execution data
    tcl_input_args NVARCHAR(MAX) NOT NULL,             -- JSON input parameters
    tcl_output_result NVARCHAR(MAX),                   -- JSON output/result
    tcl_error_message NVARCHAR(MAX),                   -- Error details if failed

    -- Status tracking
    tcl_status VARCHAR(20) NOT NULL,                   -- 'pending', 'running', 'success', 'failed', 'cancelled'
    tcl_side_effect_level VARCHAR(20),                 -- 'none', 'draft', 'external', 'financial', 'inventory'
    tcl_requires_confirmation BIT DEFAULT 0,
    tcl_confirmed_at DATETIME2,
    tcl_confirmed_by INT FOREIGN KEY REFERENCES TM_USR_User(usr_id),

    -- Performance metrics
    tcl_started_at DATETIME2,
    tcl_completed_at DATETIME2,
    tcl_duration_ms INT,

    -- Idempotency (required for external/financial operations)
    tcl_idempotency_key VARCHAR(100),

    -- User/tenant
    usr_id INT NOT NULL FOREIGN KEY REFERENCES TM_USR_User(usr_id),
    soc_id INT NOT NULL FOREIGN KEY REFERENCES TR_SOC_Society(soc_id),

    INDEX idx_conversation (cpc_id, tcl_started_at),
    INDEX idx_status (tcl_status),
    INDEX idx_user (usr_id, tcl_started_at DESC),
    INDEX idx_idempotency (tcl_idempotency_key) WHERE tcl_idempotency_key IS NOT NULL
);
```

#### TM_APR_Approval_Request
```sql
CREATE TABLE TM_APR_Approval_Request (
    apr_id INT IDENTITY(1,1) PRIMARY KEY,
    apr_uuid VARCHAR(36) NOT NULL UNIQUE,

    -- Reference
    tcl_id INT NOT NULL FOREIGN KEY REFERENCES TM_TCL_Tool_Call_Log(tcl_id),
    cpc_id INT NOT NULL FOREIGN KEY REFERENCES TM_CPC_Copilot_Conversation(cpc_id),

    -- Approver requirements
    apr_required_role_level INT,                       -- Minimum role level (from TR_ROL_Role.rol_level)
    apr_approver_role_id INT FOREIGN KEY REFERENCES TR_ROL_Role(rol_id),

    -- Status
    apr_status VARCHAR(20) DEFAULT 'pending',          -- 'pending', 'approved', 'rejected', 'expired'
    apr_expires_at DATETIME2,                          -- Auto-reject after expiry

    -- Approval action
    apr_approved_by INT FOREIGN KEY REFERENCES TM_USR_User(usr_id),
    apr_approved_at DATETIME2,
    apr_rejection_reason NVARCHAR(500),

    -- Metadata
    apr_created_at DATETIME2 DEFAULT GETDATE(),

    INDEX idx_status (apr_status, apr_expires_at),
    INDEX idx_approver (apr_approver_role_id)
);
```

#### TM_UIB_UI_Block_Log
```sql
CREATE TABLE TM_UIB_UI_Block_Log (
    uib_id INT IDENTITY(1,1) PRIMARY KEY,
    cpc_id INT NOT NULL FOREIGN KEY REFERENCES TM_CPC_Copilot_Conversation(cpc_id),
    cpm_id INT FOREIGN KEY REFERENCES TM_CPM_Copilot_Message(cpm_id),

    -- UI block data
    uib_type VARCHAR(50) NOT NULL,                     -- 'ActionCard', 'DataTable', 'ChartCard', etc.
    uib_payload NVARCHAR(MAX) NOT NULL,                -- JSON props for Tambo component

    -- Interaction tracking
    uib_rendered BIT DEFAULT 0,
    uib_interacted BIT DEFAULT 0,                      -- User clicked/interacted
    uib_interaction_result NVARCHAR(MAX),              -- Result of interaction (e.g., confirmed action)

    -- Metadata
    uib_created_at DATETIME2 DEFAULT GETDATE(),

    INDEX idx_conversation (cpc_id, uib_created_at),
    INDEX idx_message (cpm_id)
);
```

### 3.2 Integration with Existing RBAC Tables

#### Querying User Permissions for Tools

```sql
-- Example: Check if user can execute "products.create" tool
SELECT r.rit_create
FROM TR_RIT_Right r
JOIN TR_SAM_Screen_API_Mapping sam ON r.scr_id = sam.scr_id
WHERE r.rol_id = @user_role_id
  AND sam.sam_api_resource = 'products'
  AND r.rit_active = 1;
```

#### Permission Mapping: Tools → RBAC Actions

| Tool Category | Required Permission Column |
|---------------|---------------------------|
| `*.create` | `rit_create = 1` |
| `*.read`, `*.list`, `*.search` | `rit_read = 1` |
| `*.update` | `rit_modify = 1` |
| `*.delete` | `rit_delete = 1` |
| `*.approve`, `*.validate` | `rit_valid = 1` |
| `*.cancel`, `*.void` | `rit_cancel = 1` |
| `*.activate`, `*.deactivate` | `rit_active = 1` |
| `*.admin_*` | `rit_super_right = 1` |

---

## 4. Backend Implementation

### 4.1 FastAPI API Endpoints

#### File: `backend/app/api/v1/copilot.py`

```python
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import asyncio

from app.api.deps import get_db, get_current_active_user
from app.services.copilot_service import CopilotService, get_copilot_service
from app.schemas.copilot import (
    ChatRequest,
    ChatResponse,
    ConfirmActionRequest,
    ToolManifestResponse,
    ConversationHistoryResponse
)
from app.models.user import User

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    service: CopilotService = Depends(get_copilot_service)
):
    """
    Start or continue a conversation.

    Returns:
    - conversation_id: UUID for SSE stream
    - message_id: UUID of assistant's response
    - requires_stream: True if response is being streamed
    """
    try:
        result = await service.handle_message(
            user_id=current_user.usr_id,
            message=request.message,
            conversation_id=request.conversation_id,
            context=request.context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stream")
async def stream(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    service: CopilotService = Depends(get_copilot_service)
):
    """
    SSE stream for real-time updates.

    Event types:
    - token: Streaming text tokens
    - plan: Agent's plan before execution
    - tool_call_started: Tool execution started
    - tool_call_result: Tool execution completed
    - ui_block: Generative UI component
    - error: Error occurred
    - done: Stream complete
    """
    async def event_generator():
        try:
            async for event in service.stream_conversation(
                conversation_id=conversation_id,
                user_id=current_user.usr_id
            ):
                # SSE format: event: <type>\ndata: <json>\n\n
                yield f"event: {event['type']}\n"
                yield f"data: {json.dumps(event['data'])}\n\n"

                # Flush after each event
                await asyncio.sleep(0)

        except Exception as e:
            error_event = {
                "type": "error",
                "data": {"message": str(e)}
            }
            yield f"event: error\n"
            yield f"data: {json.dumps(error_event['data'])}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.post("/confirm")
async def confirm_action(
    request: ConfirmActionRequest,
    current_user: User = Depends(get_current_active_user),
    service: CopilotService = Depends(get_copilot_service)
):
    """
    Approve or reject a pending tool call.

    Required for tools with side_effect_level != 'none'
    """
    try:
        result = await service.confirm_tool_call(
            tool_call_id=request.tool_call_id,
            user_id=current_user.usr_id,
            approved=request.approved,
            rejection_reason=request.rejection_reason
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tools/manifest", response_model=ToolManifestResponse)
async def get_tools_manifest(
    current_user: User = Depends(get_current_active_user),
    service: CopilotService = Depends(get_copilot_service)
):
    """
    Get list of available tools for current user.

    Filtered by user's role permissions.
    """
    manifest = await service.get_user_tools_manifest(
        user_id=current_user.usr_id,
        role_id=current_user.rol_id
    )
    return manifest


@router.get("/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    conversation_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    service: CopilotService = Depends(get_copilot_service)
):
    """
    Get conversation history.

    If conversation_id provided: messages for that conversation
    Otherwise: list of user's conversations
    """
    history = await service.get_conversation_history(
        user_id=current_user.usr_id,
        conversation_id=conversation_id,
        limit=limit,
        offset=offset
    )
    return history
```

### 4.2 CopilotService Implementation

#### File: `backend/app/services/copilot_service.py`

```python
from typing import Dict, Any, List, Optional, AsyncGenerator
from sqlalchemy.orm import Session
from sqlalchemy import select
import asyncio
import json
import uuid
from datetime import datetime, timedelta

from app.models.copilot import (
    CopilotConversation,
    CopilotMessage,
    ToolCallLog,
    ApprovalRequest
)
from app.services.tool_registry import ToolRegistry
from app.services.policy_engine import PolicyEngine
from app.services.context_builder import ContextBuilder
from app.services.ui_composer import UIComposer
from app.core.llm_client import LLMClient
from app.core.database import get_db


class CopilotServiceError(Exception):
    """Base exception for CopilotService"""
    pass


class CopilotService:
    """
    Main agent orchestration service.

    Responsibilities:
    1. Context building from request
    2. LLM interaction for planning
    3. Tool execution coordination
    4. Permission validation
    5. SSE event streaming
    6. UI block generation
    """

    def __init__(
        self,
        db: Session,
        tool_registry: ToolRegistry,
        policy_engine: PolicyEngine,
        llm_client: LLMClient
    ):
        self.db = db
        self.tools = tool_registry
        self.policy = policy_engine
        self.llm = llm_client
        self.context_builder = ContextBuilder(db)
        self.ui_composer = UIComposer()

    async def handle_message(
        self,
        user_id: int,
        message: str,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a user message and return response metadata.

        Actual response is streamed via /stream endpoint.
        """
        # Create or load conversation
        conversation = await self._get_or_create_conversation(
            user_id=user_id,
            conversation_id=conversation_id,
            context=context
        )

        # Save user message
        user_message = self._save_message(
            conversation_id=conversation.cpc_id,
            role="user",
            content=message
        )

        return {
            "conversation_id": conversation.cpc_uuid,
            "message_id": user_message.cpm_uuid,
            "requires_stream": True
        }

    async def stream_conversation(
        self,
        conversation_id: str,
        user_id: int
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream conversation events via SSE.

        Event flow:
        1. Build context
        2. Call LLM for planning
        3. Validate permissions
        4. If confirmation needed: yield ui_block + wait
        5. Execute tools
        6. Call LLM for final response
        7. Yield UI blocks
        8. Done
        """
        try:
            # Load conversation
            conversation = await self._load_conversation(conversation_id, user_id)

            # Build context
            context = await self.context_builder.build_context(
                conversation=conversation,
                user_id=user_id
            )

            # Get last user message
            last_message = self._get_last_user_message(conversation.cpc_id)

            # Phase 1: Planning
            yield {"type": "status", "data": {"status": "planning"}}

            plan_result = await self.llm.plan(
                context=context,
                message=last_message.cpm_content,
                tools=self.tools.get_user_tools(user_id, context["role_id"])
            )

            if plan_result.get("text"):
                # Stream text tokens
                for token in plan_result["text"].split():
                    yield {"type": "token", "data": {"token": token + " "}}
                    await asyncio.sleep(0.01)  # Simulated streaming

            # Phase 2: Tool execution
            if plan_result.get("tool_calls"):
                for tool_call in plan_result["tool_calls"]:
                    async for event in self._execute_tool_call(
                        tool_call=tool_call,
                        conversation_id=conversation.cpc_id,
                        user_id=user_id,
                        context=context
                    ):
                        yield event

            # Phase 3: Final response generation
            if plan_result.get("tool_results"):
                final_response = await self.llm.generate_response(
                    context=context,
                    tool_results=plan_result["tool_results"]
                )

                # Save assistant message
                self._save_message(
                    conversation_id=conversation.cpc_id,
                    role="assistant",
                    content=final_response["text"],
                    ui_blocks=final_response.get("ui_blocks")
                )

                # Stream UI blocks
                if final_response.get("ui_blocks"):
                    for block in final_response["ui_blocks"]:
                        yield {
                            "type": "ui_block",
                            "data": block
                        }

            yield {"type": "done", "data": {}}

        except Exception as e:
            yield {
                "type": "error",
                "data": {"message": str(e)}
            }

    async def _execute_tool_call(
        self,
        tool_call: Dict[str, Any],
        conversation_id: int,
        user_id: int,
        context: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Execute a single tool call with permission checks.
        """
        tool_name = tool_call["name"]
        tool_args = tool_call["arguments"]

        # Create tool call log
        tcl = ToolCallLog(
            tcl_uuid=str(uuid.uuid4()),
            cpc_id=conversation_id,
            tcl_tool_name=tool_name,
            tcl_input_args=json.dumps(tool_args),
            tcl_status="pending",
            usr_id=user_id,
            soc_id=context["soc_id"]
        )
        self.db.add(tcl)
        self.db.commit()

        # Check permissions
        tool_def = self.tools.get_tool(tool_name)
        has_permission = await self.policy.check_permission(
            user_id=user_id,
            role_id=context["role_id"],
            tool_name=tool_name,
            required_permissions=tool_def["required_permissions"]
        )

        if not has_permission:
            tcl.tcl_status = "failed"
            tcl.tcl_error_message = "Insufficient permissions"
            self.db.commit()

            yield {
                "type": "error",
                "data": {
                    "tool_call_id": tcl.tcl_uuid,
                    "message": "You don't have permission to execute this action"
                }
            }
            return

        # Check if confirmation required
        requires_confirmation = (
            tool_def["side_effect_level"] in ["external", "financial", "inventory"]
        )

        if requires_confirmation:
            # Generate ActionCard
            action_card = self.ui_composer.create_action_card(
                tool_name=tool_name,
                tool_args=tool_args,
                tool_def=tool_def
            )

            tcl.tcl_requires_confirmation = True
            self.db.commit()

            yield {
                "type": "ui_block",
                "data": action_card
            }

            yield {
                "type": "awaiting_confirmation",
                "data": {
                    "tool_call_id": tcl.tcl_uuid,
                    "action_card": action_card
                }
            }

            # Wait for confirmation (handled separately via /confirm endpoint)
            return

        # Execute tool
        yield {
            "type": "tool_call_started",
            "data": {
                "tool_call_id": tcl.tcl_uuid,
                "tool_name": tool_name
            }
        }

        tcl.tcl_status = "running"
        tcl.tcl_started_at = datetime.utcnow()
        self.db.commit()

        try:
            # Get tool handler
            handler = self.tools.get_handler(tool_name)

            # Execute with idempotency key if needed
            if tool_def["side_effect_level"] in ["external", "financial"]:
                idempotency_key = f"{tool_name}:{uuid.uuid4()}"
                tcl.tcl_idempotency_key = idempotency_key
                result = await handler(
                    db=self.db,
                    args=tool_args,
                    idempotency_key=idempotency_key
                )
            else:
                result = await handler(db=self.db, args=tool_args)

            # Success
            tcl.tcl_status = "success"
            tcl.tcl_output_result = json.dumps(result)
            tcl.tcl_completed_at = datetime.utcnow()
            tcl.tcl_duration_ms = int(
                (tcl.tcl_completed_at - tcl.tcl_started_at).total_seconds() * 1000
            )
            self.db.commit()

            yield {
                "type": "tool_call_result",
                "data": {
                    "tool_call_id": tcl.tcl_uuid,
                    "tool_name": tool_name,
                    "result": result,
                    "duration_ms": tcl.tcl_duration_ms
                }
            }

            # Generate UI block if applicable
            ui_block = self.ui_composer.map_tool_result_to_ui(
                tool_name=tool_name,
                result=result
            )

            if ui_block:
                yield {
                    "type": "ui_block",
                    "data": ui_block
                }

        except Exception as e:
            tcl.tcl_status = "failed"
            tcl.tcl_error_message = str(e)
            tcl.tcl_completed_at = datetime.utcnow()
            self.db.commit()

            yield {
                "type": "tool_call_failed",
                "data": {
                    "tool_call_id": tcl.tcl_uuid,
                    "tool_name": tool_name,
                    "error": str(e)
                }
            }

    async def confirm_tool_call(
        self,
        tool_call_id: str,
        user_id: int,
        approved: bool,
        rejection_reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Approve or reject a pending tool call.
        """
        # Load tool call
        tcl = self.db.query(ToolCallLog).filter(
            ToolCallLog.tcl_uuid == tool_call_id,
            ToolCallLog.tcl_status == "pending",
            ToolCallLog.tcl_requires_confirmation == True
        ).first()

        if not tcl:
            raise CopilotServiceError("Tool call not found or not pending")

        if approved:
            # Execute the tool
            # (Simplified - in production, re-trigger execution flow)
            tcl.tcl_confirmed_at = datetime.utcnow()
            tcl.tcl_confirmed_by = user_id
            self.db.commit()

            return {
                "status": "approved",
                "tool_call_id": tool_call_id,
                "message": "Tool execution approved. Processing..."
            }
        else:
            tcl.tcl_status = "cancelled"
            tcl.tcl_error_message = rejection_reason or "User rejected"
            self.db.commit()

            return {
                "status": "rejected",
                "tool_call_id": tool_call_id,
                "message": "Action cancelled"
            }

    # Helper methods
    async def _get_or_create_conversation(
        self,
        user_id: int,
        conversation_id: Optional[str],
        context: Optional[Dict[str, Any]]
    ) -> CopilotConversation:
        """Load existing or create new conversation."""
        if conversation_id:
            conv = self.db.query(CopilotConversation).filter(
                CopilotConversation.cpc_uuid == conversation_id,
                CopilotConversation.usr_id == user_id
            ).first()
            if conv:
                return conv

        # Create new
        conv = CopilotConversation(
            cpc_uuid=str(uuid.uuid4()),
            usr_id=user_id,
            soc_id=context.get("soc_id") if context else None,
            bu_id=context.get("bu_id") if context else None,
            cpc_context_route=context.get("route") if context else None,
            cpc_context_entity_type=context.get("entity_type") if context else None,
            cpc_context_entity_id=context.get("entity_id") if context else None,
            cpc_context_json=json.dumps(context) if context else None
        )
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv


def get_copilot_service(db: Session = Depends(get_db)) -> CopilotService:
    """Dependency injection factory."""
    from app.services.tool_registry import get_tool_registry
    from app.services.policy_engine import get_policy_engine
    from app.core.llm_client import get_llm_client

    return CopilotService(
        db=db,
        tool_registry=get_tool_registry(),
        policy_engine=get_policy_engine(db),
        llm_client=get_llm_client()
    )
```

---

## 5. Frontend Implementation

### 5.1 Copilot Panel Component

#### File: `frontend/src/components/copilot/CopilotPanel.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCopilotChat } from '@/hooks/useCopilotChat'
import { MessageThread } from './MessageThread'
import { ToolTimeline } from './ToolTimeline'
import { ContextHeader } from './ContextHeader'
import { ChatInput } from './ChatInput'
import { TamboRenderer } from './TamboRenderer'

interface CopilotPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function CopilotPanel({ isOpen, onClose }: CopilotPanelProps) {
  const { user } = useAuthStore()
  const {
    messages,
    toolCalls,
    sendMessage,
    isStreaming,
    conversationId
  } = useCopilotChat()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    await sendMessage(input)
    setInput('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl flex flex-col border-l border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h2 className="font-semibold text-lg">AI Copilot</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Context */}
      <ContextHeader />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageThread messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Tool Timeline */}
      {toolCalls.length > 0 && (
        <div className="border-t bg-gray-50 p-3">
          <ToolTimeline calls={toolCalls} />
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isStreaming}
          placeholder="Ask me anything about your ERP data..."
        />
      </div>
    </div>
  )
}
```

### 5.2 SSE Hook for Streaming

#### File: `frontend/src/hooks/useCopilotChat.ts`

```typescript
import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { copilotApi } from '@/api/copilot'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  uiBlocks?: any[]
  timestamp: string
}

export interface ToolCall {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'failed'
  startedAt?: string
  completedAt?: string
  result?: any
  error?: string
}

export function useCopilotChat() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)

  // Send message and start streaming
  const sendMessage = useCallback(async (content: string) => {
    if (!user) return

    // Add user message immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Call chat API
      const response = await copilotApi.sendMessage({
        message: content,
        conversation_id: conversationId,
        context: {
          route: window.location.pathname,
          // Add more context as needed
        }
      })

      setConversationId(response.conversation_id)

      // Start SSE stream
      if (response.requires_stream) {
        startStreaming(response.conversation_id)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [conversationId, user])

  // SSE streaming
  const startStreaming = useCallback((convId: string) => {
    setIsStreaming(true)

    const token = localStorage.getItem('access_token')
    const url = `${import.meta.env.VITE_API_BASE_URL}/copilot/stream?conversation_id=${convId}`

    const es = new EventSource(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    } as any)

    let currentAssistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }

    es.addEventListener('token', (event) => {
      const data = JSON.parse(event.data)
      currentAssistantMessage.content += data.token

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.id === currentAssistantMessage.id) {
          return [...prev.slice(0, -1), { ...currentAssistantMessage }]
        }
        return [...prev, { ...currentAssistantMessage }]
      })
    })

    es.addEventListener('tool_call_started', (event) => {
      const data = JSON.parse(event.data)
      setToolCalls(prev => [...prev, {
        id: data.tool_call_id,
        name: data.tool_name,
        status: 'running',
        startedAt: new Date().toISOString()
      }])
    })

    es.addEventListener('tool_call_result', (event) => {
      const data = JSON.parse(event.data)
      setToolCalls(prev => prev.map(tc =>
        tc.id === data.tool_call_id
          ? {
              ...tc,
              status: 'success',
              result: data.result,
              completedAt: new Date().toISOString()
            }
          : tc
      ))
    })

    es.addEventListener('ui_block', (event) => {
      const data = JSON.parse(event.data)

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              uiBlocks: [...(lastMessage.uiBlocks || []), data]
            }
          ]
        }
        return prev
      })
    })

    es.addEventListener('error', (event) => {
      const data = JSON.parse(event.data)
      console.error('Stream error:', data)
      es.close()
      setIsStreaming(false)
    })

    es.addEventListener('done', () => {
      es.close()
      setIsStreaming(false)
    })

    eventSourceRef.current = es
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  return {
    messages,
    toolCalls,
    sendMessage,
    isStreaming,
    conversationId
  }
}
```

---

## 6. Tool Registry & Manifest

### 6.1 Tool Definition Schema

```python
from typing import Dict, Any, Callable, List, Optional
from pydantic import BaseModel, Field

class ToolDefinition(BaseModel):
    """Schema for tool registration."""

    name: str = Field(..., description="Unique tool identifier (e.g., 'products.create')")
    description: str = Field(..., description="Human-readable description for LLM")
    category: str = Field(..., description="Tool category (crud, analytics, integration)")

    input_schema: Dict[str, Any] = Field(..., description="JSON Schema for input parameters")
    output_schema: Dict[str, Any] = Field(..., description="JSON Schema for output")

    # Permissions
    required_permissions: List[str] = Field(
        default=[],
        description="RBAC permission columns required (e.g., ['rit_create'])"
    )
    required_api_resource: str = Field(
        ...,
        description="API resource name mapped via TR_SAM_Screen_API_Mapping"
    )

    # Safety
    side_effect_level: str = Field(
        default="none",
        description="none|draft|external|financial|inventory"
    )
    requires_idempotency: bool = Field(
        default=False,
        description="Whether tool requires idempotency key"
    )

    # Metadata
    version: str = Field(default="1.0.0")
    tags: List[str] = Field(default=[])

    # Handler (not serialized to manifest)
    handler: Optional[Callable] = Field(
        default=None,
        exclude=True,
        description="Async callable that executes the tool"
    )
```

### 6.2 Tool Registry Implementation

#### File: `backend/app/services/tool_registry.py`

```python
from typing import Dict, List, Callable, Optional
from app.schemas.tool_definition import ToolDefinition

class ToolRegistry:
    """
    Central registry for all Copilot tools.

    Tools are registered at app startup and filtered by user permissions.
    """

    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}

    def register(self, tool: ToolDefinition):
        """Register a tool."""
        if tool.name in self._tools:
            raise ValueError(f"Tool {tool.name} already registered")

        if tool.handler is None:
            raise ValueError(f"Tool {tool.name} has no handler")

        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> ToolDefinition:
        """Get tool definition by name."""
        if name not in self._tools:
            raise KeyError(f"Tool {name} not found")
        return self._tools[name]

    def get_handler(self, name: str) -> Callable:
        """Get tool handler function."""
        tool = self.get_tool(name)
        return tool.handler

    def get_user_tools(
        self,
        user_id: int,
        role_id: int,
        filter_permissions: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get tools available to user.

        If filter_permissions=True, only return tools user has permission for.
        """
        tools = []

        for tool in self._tools.values():
            # Serialize for LLM (excluding handler)
            tool_dict = tool.model_dump(exclude={'handler'})
            tools.append(tool_dict)

        # TODO: Filter by user permissions via PolicyEngine

        return tools

    def list_all(self) -> List[str]:
        """List all registered tool names."""
        return list(self._tools.keys())


# Global singleton
_registry = None

def get_tool_registry() -> ToolRegistry:
    """Get or create global tool registry."""
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
        # Register all tools (done at app startup)
        register_all_tools(_registry)
    return _registry


def register_all_tools(registry: ToolRegistry):
    """Register all available tools."""
    # Import tool modules
    from app.tools import (
        product_tools,
        client_tools,
        invoice_tools,
        order_tools,
        payment_tools,
        report_tools,
        integration_tools
    )

    # Each module has register_tools(registry) function
    product_tools.register_tools(registry)
    client_tools.register_tools(registry)
    invoice_tools.register_tools(registry)
    order_tools.register_tools(registry)
    payment_tools.register_tools(registry)
    report_tools.register_tools(registry)
    integration_tools.register_tools(registry)
```

### 6.3 Example Tool Implementations

#### File: `backend/app/tools/product_tools.py`

```python
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.services.tool_registry import ToolRegistry
from app.schemas.tool_definition import ToolDefinition
from app.services.product_service import ProductService

async def create_product_handler(
    db: Session,
    args: Dict[str, Any],
    idempotency_key: str = None
) -> Dict[str, Any]:
    """
    Handler for products.create tool.
    """
    service = ProductService(db)

    product = await service.create_product(
        sku=args["sku"],
        name=args["name"],
        category_id=args.get("category_id"),
        price=args.get("price"),
        description=args.get("description")
    )

    return {
        "product_id": product.prd_id,
        "sku": product.prd_sku,
        "name": product.prd_name,
        "message": f"Product {product.prd_sku} created successfully"
    }


async def search_products_handler(
    db: Session,
    args: Dict[str, Any],
    idempotency_key: str = None
) -> Dict[str, Any]:
    """
    Handler for products.search tool.
    """
    service = ProductService(db)

    results = await service.search_products(
        query=args.get("query"),
        category_id=args.get("category_id"),
        limit=args.get("limit", 20)
    )

    return {
        "products": [
            {
                "id": p.prd_id,
                "sku": p.prd_sku,
                "name": p.prd_name,
                "price": p.prd_price
            }
            for p in results
        ],
        "count": len(results)
    }


def register_tools(registry: ToolRegistry):
    """Register product-related tools."""

    # products.create
    registry.register(ToolDefinition(
        name="products.create",
        description="Create a new product in the catalog",
        category="crud",
        required_api_resource="products",
        required_permissions=["rit_create"],
        side_effect_level="draft",
        input_schema={
            "type": "object",
            "properties": {
                "sku": {"type": "string", "description": "Product SKU code"},
                "name": {"type": "string", "description": "Product name"},
                "category_id": {"type": "integer", "description": "Product category ID"},
                "price": {"type": "number", "description": "Unit price"},
                "description": {"type": "string", "description": "Product description"}
            },
            "required": ["sku", "name"]
        },
        output_schema={
            "type": "object",
            "properties": {
                "product_id": {"type": "integer"},
                "sku": {"type": "string"},
                "name": {"type": "string"},
                "message": {"type": "string"}
            }
        },
        handler=create_product_handler
    ))

    # products.search
    registry.register(ToolDefinition(
        name="products.search",
        description="Search products by keyword, SKU, or category",
        category="crud",
        required_api_resource="products",
        required_permissions=["rit_read"],
        side_effect_level="none",
        input_schema={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "category_id": {"type": "integer", "description": "Filter by category"},
                "limit": {"type": "integer", "description": "Max results", "default": 20}
            }
        },
        output_schema={
            "type": "object",
            "properties": {
                "products": {"type": "array"},
                "count": {"type": "integer"}
            }
        },
        handler=search_products_handler
    ))
```

---

## 7. Security & RBAC Integration

### 7.1 PolicyEngine Service

#### File: `backend/app/services/policy_engine.py`

```python
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.rbac import Right, ScreenAPIMapping
from app.models.user import User

class PolicyEngine:
    """
    Permission checking via existing RBAC tables.

    Integrates with:
    - TR_ROL_Role (roles)
    - TR_RIT_Right (permissions)
    - TR_SAM_Screen_API_Mapping (screen → API mapping)
    """

    def __init__(self, db: Session):
        self.db = db

    async def check_permission(
        self,
        user_id: int,
        role_id: int,
        tool_name: str,
        required_permissions: List[str]
    ) -> bool:
        """
        Check if user has permissions for tool.

        Args:
            user_id: User ID
            role_id: User's role ID
            tool_name: Tool name (e.g., "products.create")
            required_permissions: List of permission columns (e.g., ["rit_create"])

        Returns:
            True if user has all required permissions
        """
        # Extract API resource from tool name (e.g., "products" from "products.create")
        api_resource = tool_name.split('.')[0]

        # Query permission via RBAC tables
        stmt = (
            select(Right)
            .join(ScreenAPIMapping, Right.scr_id == ScreenAPIMapping.scr_id)
            .where(
                Right.rol_id == role_id,
                ScreenAPIMapping.sam_api_resource == api_resource,
                Right.rit_active == True
            )
        )

        result = self.db.execute(stmt).scalar_one_or_none()

        if not result:
            return False

        # Check each required permission column
        for perm in required_permissions:
            if not getattr(result, perm, False):
                return False

        return True

    def get_user_tool_permissions(
        self,
        role_id: int
    ) -> Dict[str, List[str]]:
        """
        Get all API resources and actions user can access.

        Returns:
            {
                "products": ["rit_read", "rit_create"],
                "invoices": ["rit_read", "rit_create", "rit_modify"],
                ...
            }
        """
        stmt = (
            select(Right, ScreenAPIMapping)
            .join(ScreenAPIMapping, Right.scr_id == ScreenAPIMapping.scr_id)
            .where(
                Right.rol_id == role_id,
                Right.rit_active == True
            )
        )

        results = self.db.execute(stmt).all()

        permissions = {}
        for right, mapping in results:
            resource = mapping.sam_api_resource
            if resource not in permissions:
                permissions[resource] = []

            # Add permission columns that are True
            for perm in ["rit_read", "rit_create", "rit_modify", "rit_delete",
                         "rit_valid", "rit_cancel", "rit_active", "rit_super_right"]:
                if getattr(right, perm, False):
                    permissions[resource].append(perm)

        return permissions


def get_policy_engine(db: Session) -> PolicyEngine:
    """Dependency injection factory."""
    return PolicyEngine(db)
```

### 7.2 Security Considerations

#### Authentication
- All `/copilot/*` endpoints require authenticated user via `Depends(get_current_active_user)`
- JWT token validated on every request
- SSE streams verify token before establishing connection

#### Authorization
- **Tool-level permissions**: Each tool declares `required_permissions` and `required_api_resource`
- **RBAC query**: PolicyEngine checks `TR_RIT_Right` table for user's role
- **Permission inheritance**: Role hierarchy supported via `TR_ROL_Role.rol_parent_id`
- **Business unit isolation**: All queries filtered by user's `soc_id` and `bu_id`

#### Data Isolation
- Every tool call logged with `usr_id`, `soc_id`
- Conversation context includes `soc_id`, `bu_id`
- Service layer enforces society filtering on all queries

#### Side-Effect Protection
- Tools with `side_effect_level` != "none" require confirmation
- ActionCard rendered before execution
- User must explicitly approve via `/confirm` endpoint
- Approval logged in `TM_APR_Approval_Request`

#### Idempotency
- Tools with external/financial side effects require idempotency key
- Prevents duplicate executions (email sends, invoice posts, Shopify writes)
- Idempotency key stored in `TM_TCL_Tool_Call_Log.tcl_idempotency_key`

#### Audit Trail
- Every tool call logged in `TM_TCL_Tool_Call_Log`
- Includes: input args, output result, duration, errors
- Every message logged in `TM_CPM_Copilot_Message`
- Every UI block logged in `TM_UIB_UI_Block_Log`

---

## 8. Generative UI with Tambo

### 8.1 Tambo Component Registry

#### File: `frontend/src/components/copilot/TamboRegistry.tsx`

```typescript
import { createTamboRegistry } from '@tambo/react'
import { ActionCard } from './tambo/ActionCard'
import { DataTable } from './tambo/DataTable'
import { ChartCard } from './tambo/ChartCard'
import { RecordPreview } from './tambo/RecordPreview'
import { EmailDraft } from './tambo/EmailDraft'
import { InvoiceSendWizard } from './tambo/InvoiceSendWizard'
import { FormWizard } from './tambo/FormWizard'
import { ToolErrorCard } from './tambo/ToolErrorCard'

export const tamboRegistry = createTamboRegistry({
  components: {
    // Confirmation gate
    ActionCard: {
      component: ActionCard,
      schema: {
        type: 'object',
        properties: {
          tool_name: { type: 'string' },
          tool_description: { type: 'string' },
          action_summary: { type: 'string' },
          parameters: { type: 'object' },
          risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
          side_effects: { type: 'array', items: { type: 'string' } }
        },
        required: ['tool_name', 'action_summary']
      }
    },

    // Data display
    DataTable: {
      component: DataTable,
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          columns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                label: { type: 'string' },
                type: { type: 'string' }
              }
            }
          },
          rows: { type: 'array' },
          total_count: { type: 'number' },
          actions: { type: 'array' }
        },
        required: ['columns', 'rows']
      }
    },

    // Analytics visualization
    ChartCard: {
      component: ChartCard,
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          chart_type: { type: 'string', enum: ['bar', 'line', 'pie', 'area'] },
          series: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                data: { type: 'array' }
              }
            }
          },
          x_axis: { type: 'object' },
          y_axis: { type: 'object' },
          unit: { type: 'string' }
        },
        required: ['title', 'chart_type', 'series']
      }
    },

    // Record preview
    RecordPreview: {
      component: RecordPreview,
      schema: {
        type: 'object',
        properties: {
          entity_type: { type: 'string' },
          entity_id: { type: 'number' },
          title: { type: 'string' },
          fields: { type: 'array' },
          actions: { type: 'array' }
        },
        required: ['entity_type', 'entity_id', 'fields']
      }
    },

    // Email composer
    EmailDraft: {
      component: EmailDraft,
      schema: {
        type: 'object',
        properties: {
          to: { type: 'array', items: { type: 'string' } },
          cc: { type: 'array', items: { type: 'string' } },
          subject: { type: 'string' },
          body: { type: 'string' },
          attachments: { type: 'array' }
        },
        required: ['to', 'subject', 'body']
      }
    },

    // Error display
    ToolErrorCard: {
      component: ToolErrorCard,
      schema: {
        type: 'object',
        properties: {
          tool_name: { type: 'string' },
          error_message: { type: 'string' },
          error_code: { type: 'string' },
          retry_allowed: { type: 'boolean' }
        },
        required: ['tool_name', 'error_message']
      }
    }
  }
})
```

### 8.2 Example Tambo Components

#### ActionCard Component

```typescript
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { copilotApi } from '@/api/copilot'

interface ActionCardProps {
  tool_name: string
  tool_description: string
  action_summary: string
  parameters: Record<string, any>
  risk_level: 'low' | 'medium' | 'high'
  side_effects: string[]
  tool_call_id: string
}

export function ActionCard(props: ActionCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const riskColors = {
    low: 'border-green-200 bg-green-50',
    medium: 'border-yellow-200 bg-yellow-50',
    high: 'border-red-200 bg-red-50'
  }

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await copilotApi.confirmAction({
        tool_call_id: props.tool_call_id,
        approved: true
      })
    } catch (error) {
      console.error('Failed to confirm action:', error)
    }
    setIsConfirming(false)
  }

  const handleReject = async () => {
    await copilotApi.confirmAction({
      tool_call_id: props.tool_call_id,
      approved: false,
      rejection_reason: 'User cancelled'
    })
  }

  return (
    <Card className={`p-4 border-2 ${riskColors[props.risk_level]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {props.risk_level === 'high' ? '⚠️' : '🔔'}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">
            Confirm Action: {props.tool_name}
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            {props.action_summary}
          </p>

          {/* Parameters */}
          <div className="bg-white rounded p-2 mb-3 text-xs">
            <div className="font-medium mb-1">Parameters:</div>
            <pre className="text-gray-600">
              {JSON.stringify(props.parameters, null, 2)}
            </pre>
          </div>

          {/* Side effects */}
          {props.side_effects?.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium mb-1">This will:</div>
              <ul className="text-xs text-gray-600 list-disc list-inside">
                {props.side_effects.map((effect, i) => (
                  <li key={i}>{effect}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isConfirming}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
```

#### ChartCard Component

```typescript
import React from 'react'
import { Card } from '@/components/ui/card'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

interface ChartCardProps {
  title: string
  chart_type: 'bar' | 'line' | 'pie' | 'area'
  series: Array<{
    name: string
    data: Array<{ x: any, y: number }>
  }>
  x_axis?: { label?: string }
  y_axis?: { label?: string }
  unit?: string
}

export function ChartCard(props: ChartCardProps) {
  // Transform data for Recharts
  const data = props.series[0].data.map((point, i) => {
    const row: any = { name: point.x }
    props.series.forEach(s => {
      row[s.name] = s.data[i]?.y || 0
    })
    return row
  })

  const renderChart = () => {
    switch (props.chart_type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {props.series.map((s, i) => (
              <Bar key={i} dataKey={s.name} fill={`hsl(${i * 60}, 70%, 50%)`} />
            ))}
          </BarChart>
        )

      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {props.series.map((s, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={s.name}
                stroke={`hsl(${i * 60}, 70%, 50%)`}
              />
            ))}
          </LineChart>
        )

      // ... other chart types

      default:
        return null
    }
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">{props.title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        {renderChart()}
      </ResponsiveContainer>
      {props.unit && (
        <div className="text-xs text-gray-500 text-center mt-2">
          Unit: {props.unit}
        </div>
      )}
    </Card>
  )
}
```

### 8.3 UI Composer Service

#### File: `backend/app/services/ui_composer.py`

```python
from typing import Dict, Any, Optional

class UIComposer:
    """
    Maps tool results to Tambo UI component props.

    Deterministic mapping: tool output → registered Tambo component
    """

    def create_action_card(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        tool_def: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate ActionCard props for confirmation gate.
        """
        # Determine risk level
        risk_level = "low"
        if tool_def["side_effect_level"] == "financial":
            risk_level = "high"
        elif tool_def["side_effect_level"] == "external":
            risk_level = "medium"

        # Generate side effects list
        side_effects = []
        if "create" in tool_name:
            side_effects.append(f"Create a new {tool_name.split('.')[0]} record")
        elif "send" in tool_name:
            side_effects.append("Send external communication")
        elif "delete" in tool_name:
            side_effects.append("Permanently delete data")

        return {
            "type": "ActionCard",
            "props": {
                "tool_name": tool_name,
                "tool_description": tool_def["description"],
                "action_summary": self._generate_action_summary(tool_name, tool_args),
                "parameters": tool_args,
                "risk_level": risk_level,
                "side_effects": side_effects,
                "tool_call_id": None  # Set by caller
            }
        }

    def map_tool_result_to_ui(
        self,
        tool_name: str,
        result: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Map tool execution result to UI block.

        Returns None if result doesn't warrant a UI block.
        """
        # Search tools → DataTable
        if "search" in tool_name or "list" in tool_name:
            return self._create_data_table(tool_name, result)

        # Report tools → ChartCard
        if "report" in tool_name or "analytics" in tool_name:
            return self._create_chart_card(tool_name, result)

        # Create/Update tools → RecordPreview
        if "create" in tool_name or "update" in tool_name:
            return self._create_record_preview(tool_name, result)

        # Email tools → EmailDraft
        if "email" in tool_name:
            return self._create_email_draft(tool_name, result)

        return None

    def _create_data_table(
        self,
        tool_name: str,
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create DataTable UI block."""
        entity_type = tool_name.split('.')[0]

        # Infer columns from first row
        rows = result.get("items") or result.get("products") or result.get("invoices") or []
        if not rows:
            return None

        first_row = rows[0]
        columns = [
            {"key": k, "label": k.replace("_", " ").title(), "type": "text"}
            for k in first_row.keys()
        ]

        return {
            "type": "DataTable",
            "props": {
                "title": f"{entity_type.title()} Search Results",
                "columns": columns,
                "rows": rows,
                "total_count": result.get("total", len(rows))
            }
        }

    def _create_chart_card(
        self,
        tool_name: str,
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create ChartCard UI block."""
        # Example: AR aging report
        if "aging" in tool_name:
            return {
                "type": "ChartCard",
                "props": {
                    "title": "Accounts Receivable Aging",
                    "chart_type": "bar",
                    "series": [
                        {
                            "name": "Outstanding Amount",
                            "data": [
                                {"x": bucket["bucket"], "y": bucket["amount"]}
                                for bucket in result.get("buckets", [])
                            ]
                        }
                    ],
                    "x_axis": {"label": "Aging Bucket"},
                    "y_axis": {"label": "Amount"},
                    "unit": result.get("currency", "EUR")
                }
            }

        return None

    def _generate_action_summary(
        self,
        tool_name: str,
        tool_args: Dict[str, Any]
    ) -> str:
        """Generate human-readable action summary."""
        parts = tool_name.split('.')
        entity = parts[0].rstrip('s')  # "products" → "product"
        action = parts[1]

        if action == "create":
            name = tool_args.get("name") or tool_args.get("sku") or "new record"
            return f"Create {entity} '{name}'"
        elif action == "update":
            id_val = tool_args.get("id")
            return f"Update {entity} #{id_val}"
        elif action == "delete":
            id_val = tool_args.get("id")
            return f"Delete {entity} #{id_val}"
        elif action == "send":
            to = tool_args.get("to") or tool_args.get("recipient")
            return f"Send {entity} to {to}"

        return f"{action.title()} {entity}"
```

---

## 9. Streaming Architecture

### 9.1 SSE Event Schema

```typescript
// Event types sent via SSE stream

interface SSEEvent {
  type: string
  data: any
}

// Event: token
// Streamed text tokens for assistant response
interface TokenEvent extends SSEEvent {
  type: 'token'
  data: {
    token: string  // Single word or character
  }
}

// Event: plan
// Agent's planned actions before execution
interface PlanEvent extends SSEEvent {
  type: 'plan'
  data: {
    summary: string
    tool_calls: Array<{
      name: string
      args: Record<string, any>
    }>
  }
}

// Event: tool_call_started
interface ToolCallStartedEvent extends SSEEvent {
  type: 'tool_call_started'
  data: {
    tool_call_id: string
    tool_name: string
    started_at: string
  }
}

// Event: tool_call_result
interface ToolCallResultEvent extends SSEEvent {
  type: 'tool_call_result'
  data: {
    tool_call_id: string
    tool_name: string
    result: any
    duration_ms: number
  }
}

// Event: tool_call_failed
interface ToolCallFailedEvent extends SSEEvent {
  type: 'tool_call_failed'
  data: {
    tool_call_id: string
    tool_name: string
    error: string
  }
}

// Event: ui_block
// Generative UI component to render
interface UIBlockEvent extends SSEEvent {
  type: 'ui_block'
  data: {
    type: string  // Tambo component name
    props: Record<string, any>
  }
}

// Event: awaiting_confirmation
interface AwaitingConfirmationEvent extends SSEEvent {
  type: 'awaiting_confirmation'
  data: {
    tool_call_id: string
    action_card: Record<string, any>
  }
}

// Event: error
interface ErrorEvent extends SSEEvent {
  type: 'error'
  data: {
    message: string
    code?: string
  }
}

// Event: done
interface DoneEvent extends SSEEvent {
  type: 'done'
  data: {}
}
```

### 9.2 Frontend SSE Consumer

```typescript
// frontend/src/api/copilot.ts

export const copilotApi = {
  async sendMessage(request: {
    message: string
    conversation_id?: string
    context?: any
  }) {
    const response = await apiClient.post('/copilot/chat', request)
    return response.data
  },

  async confirmAction(request: {
    tool_call_id: string
    approved: boolean
    rejection_reason?: string
  }) {
    const response = await apiClient.post('/copilot/confirm', request)
    return response.data
  },

  async getToolsManifest() {
    const response = await apiClient.get('/copilot/tools/manifest')
    return response.data
  }
}
```

---

## 10. Implementation Roadmap

### Phase 0: Foundation (Week 1-2)

**Database:**
- ✅ Create tables: TM_CPC_Copilot_Conversation, TM_CPM_Copilot_Message, TM_TCL_Tool_Call_Log
- ✅ Add SQLAlchemy models
- ✅ Run migrations

**Backend:**
- ✅ Create `/api/v1/copilot.py` router
- ✅ Implement `CopilotService` skeleton
- ✅ Set up SSE streaming endpoint `/stream`
- ✅ Implement basic message persistence

**Frontend:**
- ✅ Create `<CopilotPanel />` component
- ✅ Add panel toggle button in main layout
- ✅ Implement `useCopilotChat()` hook with SSE
- ✅ Basic message display (text only)

**Goal:** User can open panel, type message, see response (mock for now)

---

### Phase 1: Tool Registry + Core CRUD Tools (Week 3-4)

**Backend:**
- ✅ Implement `ToolRegistry` service
- ✅ Create tool definition schema
- ✅ Implement first 10 tools:
  - `products.create`, `products.search`, `products.update`
  - `clients.create`, `clients.search`
  - `invoices.createDraft`, `invoices.addLine`, `invoices.search`
  - `orders.create`, `orders.search`
- ✅ Implement `ToolRunner` with error handling
- ✅ Add tool call logging to `TM_TCL_Tool_Call_Log`

**Integration:**
- ✅ Connect tool handlers to existing services (ProductService, ClientService, etc.)
- ✅ Ensure idempotency for create operations

**Frontend:**
- ✅ Display tool call timeline
- ✅ Show tool status (pending/running/success/failed)
- ✅ Render tool results as JSON (temporary)

**Goal:** User can execute 10 core CRUD operations via chat

---

### Phase 2: RBAC Integration + Permissions (Week 5)

**Backend:**
- ✅ Implement `PolicyEngine` service
- ✅ Add RBAC permission checks before tool execution
- ✅ Create `TR_SAM_Screen_API_Mapping` table
- ✅ Seed mappings for existing screens → API resources
- ✅ Filter `/tools/manifest` by user role

**Security:**
- ✅ Test permission denial flows
- ✅ Add audit logging for failed permission checks
- ✅ Ensure society/BU isolation on all queries

**Frontend:**
- ✅ Display permission errors clearly
- ✅ Show only available tools in autocomplete/suggestions

**Goal:** Tools are properly gated by RBAC permissions

---

### Phase 3: Confirmation Gates + Action Cards (Week 6)

**Backend:**
- ✅ Implement side-effect detection logic
- ✅ Create `UIComposer.create_action_card()`
- ✅ Add `/confirm` endpoint
- ✅ Implement `TM_APR_Approval_Request` table
- ✅ Pause tool execution until confirmation received

**Frontend:**
- ✅ Implement `<ActionCard />` Tambo component
- ✅ Add "Confirm" and "Cancel" handlers
- ✅ Call `/confirm` API on user action
- ✅ Resume stream after confirmation

**Tools:**
- ✅ Tag tools with `side_effect_level`
- ✅ Add idempotency keys for external/financial tools

**Goal:** No side-effect operations execute without user confirmation

---

### Phase 4: Generative UI - Tambo Components (Week 7-8)

**Frontend:**
- ✅ Set up Tambo registry
- ✅ Implement core components:
  - `<ActionCard />` (already done in Phase 3)
  - `<DataTable />`
  - `<ChartCard />`
  - `<RecordPreview />`
  - `<EmailDraft />`
  - `<FormWizard />`
  - `<ToolErrorCard />`
- ✅ Implement `<TamboRenderer />` to dynamically mount components

**Backend:**
- ✅ Implement `UIComposer.map_tool_result_to_ui()`
- ✅ Create UI block mappings:
  - Search tools → DataTable
  - Report tools → ChartCard
  - Create/Update tools → RecordPreview
  - Email tools → EmailDraft
- ✅ Stream `ui_block` events via SSE

**Goal:** Search results render as tables, reports as charts, confirmations as cards

---

### Phase 5: Business Logic Tools (Week 9-11)

**Invoice Tools:**
- `invoices.generatePdf`
- `invoices.sendEmail`
- `invoices.createFromOrder`
- `invoices.recordPayment`
- `invoices.void`

**Payment Tools:**
- `payments.create`
- `payments.allocate`
- `payments.reconcile`

**Order Tools:**
- `orders.updateStatus`
- `orders.createDelivery`
- `orders.convertToInvoice`

**Report Tools:**
- `reports.arAging` (chart)
- `reports.marginByLot` (chart + table)
- `reports.stockLow` (table)

**Shipment Tools:**
- `shipments.update`
- `shipments.trackContainer`
- `shipments.receiveLot`

**Goal:** 80% of common ERP workflows achievable via chat

---

### Phase 6: External Integrations (Week 12-13)

**Shopify Tools:**
- `shopify.syncOrders`
- `shopify.pushInventory`
- `shopify.syncProducts`
- `shopify.webhookStatus`

**Email Tools:**
- `email.sendCustom`
- `email.sendDailyInvoiceBatch`
- `email.sendOverdueReminders`

**Export Tools:**
- `x3.exportZip`
- `x3.exportInvoices`
- `x3.exportPayments`

**PDF Tools:**
- `pdf.generateInvoice`
- `pdf.generateStatement`
- `pdf.generatePackingList`

**Integration:**
- ✅ Use existing Shopify service
- ✅ Use existing Email service (SMTP/SES)
- ✅ Use existing PDF service
- ✅ Add idempotency for all external operations

**Goal:** Copilot can trigger integrations with external systems

---

### Phase 7: Analytics & Insights (Week 14)

**Advanced Charts:**
- `analytics.salesTrend` (line chart)
- `analytics.topProducts` (bar chart)
- `analytics.customerSegments` (pie chart)
- `analytics.marginAnalysis` (multi-series chart)

**Financial Reports:**
- `reports.trialBalance`
- `reports.profitAndLoss`
- `reports.cashFlow`

**Inventory Reports:**
- `reports.stockValuation`
- `reports.turnoverRate`
- `reports.lowStockAlert`

**UI Enhancements:**
- Add drilldown links in charts (click bar → show detail)
- Export chart data as CSV
- Schedule reports for email delivery

**Goal:** Copilot provides actionable business insights

---

### Phase 8: Multi-Step Workflows (Week 15-16)

**Macro Tools** (orchestrate multiple tools):
- `workflows.invoiceSendBatch`: Generate PDFs + send emails for all ready invoices
- `workflows.poCreateFromLowStock`: Detect low stock + create PO + notify
- `workflows.lotCloseWithCosting`: Allocate costs + update inventory + mark lot closed
- `workflows.monthEndClose`: Generate reports + send summaries + lock period

**Implementation:**
- Create workflow tools that call other tools internally
- Chain tool executions with error handling
- Stream progress for each sub-step
- Rollback on failure (compensating transactions)

**Goal:** Complex multi-step operations automated via single command

---

### Phase 9: Context Awareness (Week 17)

**Route-Based Context:**
- Detect current route: `/authenticated/invoices/123`
- Auto-load entity: invoice #123
- Suggest relevant actions: "Send this invoice?", "Record payment?", "View aging?"

**Selection Context:**
- Pass selected rows from data tables
- "Export selected products to Shopify"
- "Send invoices for selected clients"

**Recent Actions:**
- Show last 5 actions in context header
- "Undo last action" support for reversible operations

**Smart Suggestions:**
- Show quick action buttons based on context
- "Current invoice is draft → [Generate PDF] [Send Email]"

**Goal:** Copilot feels context-aware and proactive

---

### Phase 10: Production Hardening (Week 18-20)

**Performance:**
- ✅ Add Redis caching for tool manifest
- ✅ Optimize RBAC queries (add indexes)
- ✅ Stream response tokens (don't wait for full response)
- ✅ Connection pooling for database

**Reliability:**
- ✅ Retry logic for LLM API calls (exponential backoff)
- ✅ Circuit breaker for external services (Shopify, email)
- ✅ Graceful degradation (if email down, queue for later)

**Security:**
- ✅ Rate limiting per user (e.g., 50 messages/hour)
- ✅ Input validation on all tool arguments
- ✅ SQL injection prevention (use parameterized queries)
- ✅ Escape user input in email templates

**Observability:**
- ✅ Add OpenTelemetry tracing
- ✅ Log all tool calls to monitoring system
- ✅ Dashboard for Copilot usage metrics
- ✅ Alert on high error rates

**Compliance:**
- ✅ GDPR: Conversation deletion endpoint
- ✅ Data retention policy (auto-delete old conversations)
- ✅ Export user's conversation history

**Goal:** Copilot is production-ready and secure

---

## 11. Testing Strategy

### 11.1 Backend Tests

**Unit Tests:**
```python
# test_tool_registry.py
def test_register_tool():
    registry = ToolRegistry()
    tool = ToolDefinition(name="test.tool", ...)
    registry.register(tool)
    assert registry.get_tool("test.tool") == tool

# test_policy_engine.py
async def test_check_permission_allowed():
    engine = PolicyEngine(db)
    result = await engine.check_permission(
        user_id=1,
        role_id=1,
        tool_name="products.create",
        required_permissions=["rit_create"]
    )
    assert result == True

# test_copilot_service.py
async def test_handle_message():
    service = CopilotService(db, tools, policy, llm)
    result = await service.handle_message(
        user_id=1,
        message="Create a product"
    )
    assert result["conversation_id"] is not None
```

**Integration Tests:**
```python
# test_api_copilot.py
async def test_chat_endpoint(client: TestClient):
    response = client.post("/api/v1/copilot/chat", json={
        "message": "List all products"
    })
    assert response.status_code == 200
    assert "conversation_id" in response.json()

async def test_stream_endpoint(client: TestClient):
    # Send message first
    chat_resp = client.post("/api/v1/copilot/chat", ...)
    conv_id = chat_resp.json()["conversation_id"]

    # Open SSE stream
    with client.stream("GET", f"/api/v1/copilot/stream?conversation_id={conv_id}") as r:
        events = []
        for line in r.iter_lines():
            if line.startswith("event:"):
                events.append(line)

        assert any("token" in e for e in events)
        assert any("done" in e for e in events)
```

**Tool Tests:**
```python
# test_product_tools.py
async def test_create_product_tool():
    handler = get_tool_registry().get_handler("products.create")
    result = await handler(
        db=test_db,
        args={"sku": "TEST-001", "name": "Test Product"}
    )
    assert result["product_id"] is not None
    assert result["sku"] == "TEST-001"
```

### 11.2 Frontend Tests

**Component Tests:**
```typescript
// CopilotPanel.test.tsx
import { render, screen } from '@testing-library/react'
import { CopilotPanel } from './CopilotPanel'

test('renders panel when open', () => {
  render(<CopilotPanel isOpen={true} onClose={() => {}} />)
  expect(screen.getByText('AI Copilot')).toBeInTheDocument()
})

test('sends message on submit', async () => {
  const { user } = renderWithProviders(<CopilotPanel isOpen={true} />)
  const input = screen.getByPlaceholderText(/ask me anything/i)

  await user.type(input, 'Create a product')
  await user.click(screen.getByRole('button', { name: /send/i }))

  // Verify API call
  expect(mockCopilotApi.sendMessage).toHaveBeenCalledWith({
    message: 'Create a product',
    ...
  })
})
```

**Hook Tests:**
```typescript
// useCopilotChat.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useCopilotChat } from './useCopilotChat'

test('sends message and receives stream', async () => {
  const { result } = renderHook(() => useCopilotChat())

  act(() => {
    result.current.sendMessage('Test message')
  })

  await waitFor(() => {
    expect(result.current.messages).toHaveLength(2)  // user + assistant
    expect(result.current.messages[1].role).toBe('assistant')
  })
})
```

**Tambo Component Tests:**
```typescript
// ActionCard.test.tsx
test('renders action card with parameters', () => {
  render(
    <ActionCard
      tool_name="products.create"
      action_summary="Create product TEST-001"
      parameters={{ sku: 'TEST-001', name: 'Test' }}
      risk_level="low"
      side_effects={['Create new product record']}
      tool_call_id="123"
    />
  )

  expect(screen.getByText(/Create product TEST-001/i)).toBeInTheDocument()
  expect(screen.getByText(/TEST-001/i)).toBeInTheDocument()
})

test('calls confirm API on approve', async () => {
  const { user } = render(<ActionCard {...props} />)

  await user.click(screen.getByRole('button', { name: /confirm/i }))

  expect(mockCopilotApi.confirmAction).toHaveBeenCalledWith({
    tool_call_id: '123',
    approved: true
  })
})
```

### 11.3 E2E Tests

```typescript
// e2e/copilot.spec.ts (Playwright)
import { test, expect } from '@playwright/test'

test('complete copilot workflow', async ({ page }) => {
  await page.goto('/authenticated/dashboard')

  // Open copilot panel
  await page.click('[data-testid="copilot-toggle"]')
  await expect(page.locator('.copilot-panel')).toBeVisible()

  // Send message
  await page.fill('[data-testid="copilot-input"]', 'Create a product SKU TEST-001')
  await page.click('[data-testid="copilot-send"]')

  // Wait for response
  await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible()

  // Verify tool call timeline
  await expect(page.locator('[data-testid="tool-call-products.create"]')).toBeVisible()

  // Check tool status
  await expect(page.locator('[data-testid="tool-status-success"]')).toBeVisible()
})

test('confirmation flow for side effects', async ({ page }) => {
  await page.goto('/authenticated/invoices')

  // Open copilot
  await page.click('[data-testid="copilot-toggle"]')

  // Request side-effect action
  await page.fill('[data-testid="copilot-input"]', 'Send invoice INV-001 to customer')
  await page.click('[data-testid="copilot-send"]')

  // Wait for ActionCard
  await expect(page.locator('[data-testid="action-card"]')).toBeVisible()

  // Verify parameters shown
  await expect(page.locator('text=INV-001')).toBeVisible()

  // Approve action
  await page.click('[data-testid="action-card-confirm"]')

  // Verify execution
  await expect(page.locator('[data-testid="tool-status-success"]')).toBeVisible()
})
```

---

## 12. Production Considerations

### 12.1 LLM Provider Configuration

**Recommended Provider:**
- **Anthropic Claude 3.5 Sonnet** for production
- Fast, reliable tool calling
- Strong instruction following
- Good cost/performance ratio

**Configuration:**
```python
# backend/app/core/llm_client.py
from anthropic import Anthropic

class LLMClient:
    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-5-sonnet-20241022"

    async def plan(
        self,
        context: Dict[str, Any],
        message: str,
        tools: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Call LLM to generate plan with tool calls.
        """
        system_prompt = self._build_system_prompt(context, tools)

        response = await asyncio.to_thread(
            self.client.messages.create,
            model=self.model,
            max_tokens=4096,
            temperature=0.1,  # Low temp for consistency
            system=system_prompt,
            messages=[
                {"role": "user", "content": message}
            ],
            tools=tools  # Anthropic tool format
        )

        return {
            "text": self._extract_text(response),
            "tool_calls": self._extract_tool_calls(response)
        }
```

**System Prompt Template:**
```python
def _build_system_prompt(self, context: Dict[str, Any], tools: List[Dict]) -> str:
    return f"""You are an AI assistant integrated into the ERP2025 system.

Current Context:
- User: {context['user_name']} (Role: {context['role_name']})
- Company: {context['society_name']}
- Business Unit: {context['bu_name']}
- Current View: {context['route']}
- Selected Entity: {context['entity_type']} #{context['entity_id']}

Your Capabilities:
You have access to {len(tools)} tools to interact with the ERP system.

IMPORTANT Rules:
1. NEVER execute tools with side effects without asking for confirmation
2. ALWAYS check permissions before suggesting actions
3. Provide clear explanations for your actions
4. If a task is ambiguous, ask clarifying questions
5. Use the most specific tool for the task
6. For data queries, use search/list tools first before creating
7. Respect the user's business unit and data isolation

Side Effect Levels:
- none: Safe to execute automatically (read operations)
- draft: Creates drafts/temporary data (auto-execute with notification)
- external: Sends emails, API calls (REQUIRES confirmation)
- financial: Money-related operations (REQUIRES confirmation)
- inventory: Stock movements (REQUIRES confirmation)

Available Tools:
{self._format_tools_for_prompt(tools)}

When you need to execute a tool:
- Use the exact tool name from the list above
- Provide all required parameters
- Explain what you're about to do before using a tool

Be helpful, accurate, and respectful of the user's permissions and context.
"""
```

### 12.2 Performance Optimization

**Caching:**
```python
# Cache tool manifest per role
@lru_cache(maxsize=100)
def get_cached_user_tools(role_id: int) -> List[Dict]:
    return tool_registry.get_user_tools(role_id=role_id)

# Cache RBAC permissions per user
@lru_cache(maxsize=1000)
def get_cached_permissions(user_id: int, role_id: int) -> Dict[str, List[str]]:
    return policy_engine.get_user_tool_permissions(role_id)
```

**Database Optimization:**
```sql
-- Indexes for copilot tables
CREATE INDEX idx_cpc_user_created ON TM_CPC_Copilot_Conversation(usr_id, cpc_created_at DESC);
CREATE INDEX idx_cpm_conversation ON TM_CPM_Copilot_Message(cpc_id, cpm_created_at);
CREATE INDEX idx_tcl_conversation ON TM_TCL_Tool_Call_Log(cpc_id, tcl_started_at);
CREATE INDEX idx_tcl_status ON TM_TCL_Tool_Call_Log(tcl_status, tcl_started_at DESC);
CREATE INDEX idx_tcl_idempotency ON TM_TCL_Tool_Call_Log(tcl_idempotency_key)
  WHERE tcl_idempotency_key IS NOT NULL;
```

**Connection Pooling:**
```python
# Increase pool size for copilot endpoints
engine = create_engine(
    DATABASE_URL,
    pool_size=20,  # Increased for SSE connections
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

### 12.3 Monitoring & Observability

**Metrics to Track:**
```python
from prometheus_client import Counter, Histogram, Gauge

# Copilot usage metrics
copilot_messages_total = Counter(
    'copilot_messages_total',
    'Total messages sent to copilot',
    ['user_id', 'role']
)

copilot_tool_calls_total = Counter(
    'copilot_tool_calls_total',
    'Total tool calls executed',
    ['tool_name', 'status']
)

copilot_tool_duration = Histogram(
    'copilot_tool_duration_seconds',
    'Tool execution duration',
    ['tool_name']
)

copilot_llm_latency = Histogram(
    'copilot_llm_latency_seconds',
    'LLM API call latency'
)

copilot_active_streams = Gauge(
    'copilot_active_streams',
    'Number of active SSE streams'
)
```

**Logging:**
```python
import structlog

logger = structlog.get_logger()

# Log every tool call
logger.info(
    "tool_call_executed",
    tool_name=tool_name,
    user_id=user_id,
    status=status,
    duration_ms=duration,
    error=error_msg if failed else None
)

# Log permission denials
logger.warning(
    "permission_denied",
    user_id=user_id,
    role_id=role_id,
    tool_name=tool_name,
    required_permissions=required_perms
)
```

### 12.4 Cost Management

**LLM API Costs:**
- Estimate: ~$0.003 per message (Claude 3.5 Sonnet)
- 10,000 messages/month = ~$30
- Cache system prompts to reduce input tokens

**Optimization Strategies:**
```python
# 1. Cache system prompt per user session
@lru_cache(maxsize=1000)
def get_system_prompt_for_user(user_id: int) -> str:
    # Build once, reuse for session
    ...

# 2. Limit conversation history sent to LLM
def get_conversation_window(messages: List, max_messages: int = 10):
    # Only send last N messages to LLM
    return messages[-max_messages:]

# 3. Use cheaper model for simple queries
def select_model(message: str, context: Dict) -> str:
    if is_simple_search(message):
        return "claude-3-haiku-20240307"  # Cheaper
    return "claude-3-5-sonnet-20241022"  # Default
```

### 12.5 Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/chat")
@limiter.limit("50/hour")  # 50 messages per hour per user
async def chat(...):
    ...

@router.get("/stream")
@limiter.limit("100/hour")  # Allow more streams (retries)
async def stream(...):
    ...
```

### 12.6 Error Recovery

**Retry Logic:**
```python
import tenacity

@tenacity.retry(
    stop=tenacity.stop_after_attempt(3),
    wait=tenacity.wait_exponential(multiplier=1, min=2, max=10),
    retry=tenacity.retry_if_exception_type(APIError)
)
async def call_llm_with_retry(...):
    return await llm_client.plan(...)
```

**Circuit Breaker:**
```python
from pybreaker import CircuitBreaker

# Protect external services
shopify_breaker = CircuitBreaker(
    fail_max=5,
    timeout_duration=60,
    name='shopify'
)

@shopify_breaker
async def sync_shopify_orders(...):
    ...
```

### 12.7 Data Retention

```python
# Scheduled task to clean old conversations
from app.tasks import celery_app

@celery_app.task
def cleanup_old_conversations():
    """Delete conversations older than 90 days."""
    cutoff_date = datetime.utcnow() - timedelta(days=90)

    db.query(CopilotConversation).filter(
        CopilotConversation.cpc_created_at < cutoff_date,
        CopilotConversation.cpc_status == 'archived'
    ).delete()

    db.commit()

# Run daily at 2 AM
celery_app.conf.beat_schedule['cleanup-conversations'] = {
    'task': 'cleanup_old_conversations',
    'schedule': crontab(hour=2, minute=0)
}
```

---

## Summary

This implementation plan provides a **production-ready architecture** for integrating a Claude-like AI Copilot into the ERP2025 system. Key highlights:

✅ **Leverages Existing Infrastructure**: Uses established FastAPI services, React patterns, and RBAC system
✅ **Tambo Generative UI**: Dynamic component rendering for rich interactions
✅ **Security-First**: Permission checks, confirmation gates, audit logs
✅ **Scalable Tool Registry**: Easy to add new capabilities
✅ **Streaming Architecture**: Real-time SSE for responsive UX
✅ **Production-Ready**: Monitoring, rate limiting, error recovery

**Next Steps:**
1. Review and approve architecture
2. Set up development environment
3. Begin Phase 0 implementation
4. Iterate through phases with continuous testing

Total estimated timeline: **18-20 weeks** for full implementation.
