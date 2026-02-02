# ERP2025 AI Copilot - Unified Production Implementation Plan

**Version:** 2.0.0
**Created:** 2026-02-02
**Status:** Architecture Design - Model Agnostic
**Integration:** Python FastAPI + Hipocap Observability + Multi-LLM Support

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Model-Agnostic LLM Integration](#3-model-agnostic-llm-integration)
4. [Hipocap Observability Integration](#4-hipocap-observability-integration)
5. [Database Schema Design](#5-database-schema-design)
6. [Backend Implementation](#6-backend-implementation)
7. [Security & RBAC Integration](#7-security--rbac-integration)
8. [Tool Registry & Execution](#8-tool-registry--execution)
9. [Frontend Implementation](#9-frontend-implementation)
10. [Generative UI with Tambo](#10-generative-ui-with-tambo)
11. [Streaming Architecture](#11-streaming-architecture)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Testing Strategy](#13-testing-strategy)
14. [Production Deployment](#14-production-deployment)

---

## 1. Executive Summary

### 1.1 Vision

Build a **production-ready AI Copilot** for ERP2025 with:
- **Model-agnostic architecture** - Support Claude, GPT-4, Gemini, and other LLM providers
- **Python-native implementation** - All agent logic in FastAPI (no separate Node.js service)
- **Hipocap observability** - Real-time security monitoring, trace visualization, and policy enforcement
- **Enterprise-grade security** - RBAC integration, prompt injection detection, PII masking
- **Full audit compliance** - Complete tool execution logs and reasoning chain traces

### 1.2 Core Capabilities

| Capability | Example User Request |
|------------|---------------------|
| **CRUD Operations** | "Create a product for LED strip 5M, category Lighting, price €45" |
| **Multi-Entity Actions** | "Generate invoice PDF for INV-2024-001, email to customer, CC accountant" |
| **Analytics & Insights** | "Show me overdue invoices by aging bucket with a chart" |
| **Workflow Automation** | "Allocate landed cost for lot L-2024-035 by weight and show cost per SKU" |
| **Integration Commands** | "Sync Shopify orders from last 7 days and create delivery notes" |
| **Data Export** | "Export all paid invoices from January to X3 format as ZIP" |

### 1.3 Key Architectural Decisions

✅ **Python-Only Backend**
- All agent orchestration in FastAPI
- No separate Node.js service
- Leverages existing Python ecosystem (pymssql, SQLAlchemy, Celery)

✅ **Model Agnostic LLM Client**
- Unified interface for multiple LLM providers
- Configurable model selection per request
- Fallback chain (Claude → GPT-4 → Gemini)
- Cost optimization via model routing

✅ **Hipocap Observability Platform**
- Real-time security monitoring (prompt injections, toxic content)
- Function-level RBAC enforcement
- Automated PII redaction in logs
- Visual reasoning chain traces
- Latency and token usage analytics

✅ **Reuses Existing Infrastructure**
- 43 existing FastAPI services with DI pattern
- 48 SQLAlchemy models with relationships
- RBAC system (TR_ROL_Role, TR_RIT_Right)
- Shopify, Email, PDF integrations
- React + TanStack Query frontend

### 1.4 Key Benefits

- **80%+ Task Coverage**: Most ERP operations via natural language
- **Provider Flexibility**: Switch LLM providers without code changes
- **Real-time Security**: Hipocap intercepts threats before execution
- **Full Observability**: Every decision traced and visualized
- **Production-Ready**: Security, monitoring, audit logs from day one
- **Cost Efficient**: Smart model routing based on task complexity

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Copilot Side Panel Component               │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ • Context Header (Company/BU/Route/Entity)            │    │
│  │ • Message Thread (User + Assistant + Tambo UI Blocks) │    │
│  │ • Tool Call Timeline (planned → running → complete)   │    │
│  │ • Input Area (text + attachments + quick actions)     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Tambo Component  │  │  API Client      │                    │
│  │  Registry         │  │  (Axios + SSE)   │                    │
│  │  - ActionCard     │  │  - /copilot/chat │                    │
│  │  - DataTable      │  │  - /copilot/stream                   │
│  │  - ChartCard      │  │  - /copilot/confirm                  │
│  │  - EmailDraft     │  └──────────────────┘                    │
│  └──────────────────┘                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / SSE
┌──────────────────────────┴──────────────────────────────────────┐
│                    BACKEND (FastAPI + Python 3.11)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Hipocap Security Layer (SDK)               │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ • Prompt injection detection (real-time)              │    │
│  │ • Sensitive keyword filtering                          │    │
│  │ • PII masking in logs (automatic)                     │    │
│  │ • Function-level RBAC enforcement                      │    │
│  │ • Trace collection and forwarding                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                             │                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           LLM Client Abstraction Layer                  │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ Unified Interface:                                      │    │
│  │  - LLMProvider (ABC)                                    │    │
│  │                                                         │    │
│  │ Implementations:                                        │    │
│  │  - ClaudeProvider (Anthropic SDK)                      │    │
│  │  - OpenAIProvider (OpenAI SDK)                         │    │
│  │  - GeminiProvider (Google AI SDK)                      │    │
│  │  - AzureOpenAIProvider                                 │    │
│  │                                                         │    │
│  │ Features:                                               │    │
│  │  - Auto-retry with exponential backoff                 │    │
│  │  - Fallback chain (primary → secondary → tertiary)    │    │
│  │  - Cost tracking per provider                          │    │
│  │  - Model capability routing (simple vs complex)       │    │
│  └────────────────────────────────────────────────────────┘    │
│                             │                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                 CopilotService (Agent Core)             │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ 1. ContextBuilder    → Route/entity/user/permissions   │    │
│  │ 2. AgentPlanner      → Message → Tool call plan        │    │
│  │ 3. SecurityShield    → Validate safety & permissions   │    │
│  │ 4. ToolRunner        → Execute tools + error handling  │    │
│  │ 5. UIComposer        → Map outputs → Tambo blocks      │    │
│  │ 6. EventStreamer     → SSE token/event emission        │    │
│  └────────────────────────────────────────────────────────┘    │
│                             │                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Tool Registry                        │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ Tool Categories:                                        │    │
│  │  - CRUD Tools (products, clients, orders, invoices)   │    │
│  │  - Analytics Tools (reports, charts, dashboards)      │    │
│  │  - Integration Tools (Shopify, email, X3 export)      │    │
│  │  - Workflow Tools (multi-step automation)             │    │
│  │                                                         │    │
│  │ Each tool defines:                                      │    │
│  │  - name, description, input/output schema             │    │
│  │  - required_permissions (RBAC mapping)                 │    │
│  │  - side_effect_level (none/draft/external/financial)  │    │
│  │  - handler (async callable)                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                             │                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │  Existing    │  │   External   │  │   Database       │      │
│  │  Services    │  │  Integrations│  │   (SQL Server)   │      │
│  │  (43 svcs)   │  │  - Shopify   │  │  - Copilot tables│      │
│  │              │  │  - Email     │  │  - Audit logs    │      │
│  │ - Client     │  │  - PDF       │  │  - Conversations │      │
│  │ - Invoice    │  │  - X3 Export │  │  - Tool calls    │      │
│  │ - Order      │  │              │  └──────────────────┘      │
│  │ - Product    │  └──────────────┘                            │
│  │ - Payment    │                                               │
│  │ - Delivery   │                                               │
│  └─────────────┘                                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                     Hipocap Platform (Cloud)                     │
├─────────────────────────────────────────────────────────────────┤
│ • Trace Visualization Dashboard                                 │
│ • Security Event Monitoring                                     │
│ • Policy Management Console                                     │
│ • Analytics & Cost Tracking                                     │
│ • Alert Configuration                                            │
└─────────────────────────────────────────────────────────────────┘
         │                           │                    │
    ┌────┴────┐              ┌──────┴──────┐    ┌────────┴────────┐
    │ Claude  │              │   OpenAI    │    │     Gemini      │
    │   API   │              │     API     │    │      API        │
    └─────────┘              └─────────────┘    └─────────────────┘
```

### 2.2 Agent Execution Flow

```
User Message Received
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. HIPOCAP SECURITY SHIELD (Input Validation)              │
│    ✓ Prompt injection detection                             │
│    ✓ Toxic content filtering                                │
│    ✓ PII detection (log but don't block)                   │
│    ✓ Rate limiting check                                    │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CONTEXT BUILDING                                          │
│    • Extract: route, entity ID, user role, BU, society      │
│    • Load: recent actions, current data, permissions        │
│    • Build system prompt with context                        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. LLM PROVIDER SELECTION                                    │
│    • Analyze task complexity                                 │
│    • Select provider (Claude for complex, GPT-4o-mini cheap)│
│    • Check provider availability + rate limits              │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. AGENT PLANNING (LLM Call #1 via Hipocap)                │
│    Input: system prompt + context + user message + tools    │
│    Output: Reasoning + Tool calls (structured)              │
│    Hipocap: Traces request/response, measures latency       │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. TOOL VALIDATION & RBAC ENFORCEMENT                        │
│    For each planned tool call:                              │
│    ✓ Check user has RBAC permission (via PolicyEngine)     │
│    ✓ Validate tool input schema                             │
│    ✓ Determine side_effect_level                           │
│    ✓ Tag as "auto-execute" or "requires_confirmation"      │
│    Hipocap: Function-level access control enforcement       │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. CONFIRMATION GATE (if side effects detected)            │
│    • Generate ActionCard UI block with details              │
│    • Stream to frontend via SSE                             │
│    • Pause execution, wait for POST /confirm                │
│    • Log approval decision to audit trail                   │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. TOOL EXECUTION                                            │
│    • Execute approved tools (parallel or sequential)        │
│    • Apply idempotency keys for financial operations       │
│    • Handle errors with retry logic                         │
│    • Stream progress events (tool_started, tool_completed)  │
│    • Save to TM_TCL_Tool_Call_Log                          │
│    Hipocap: Logs all tool inputs/outputs (PII-masked)      │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. RESPONSE GENERATION (LLM Call #2 via Hipocap)           │
│    Input: tool results + original question + context        │
│    Output: Assistant message + UI component suggestions     │
│    Hipocap: Traces reasoning chain, detects PII in output  │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. UI COMPOSITION                                            │
│    • Map tool outputs → Tambo components (DataTable, Chart)│
│    • Generate component props (columns, data, formatting)   │
│    • Stream ui_block events to frontend                     │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. HIPOCAP TRACE FINALIZATION                              │
│     • Close trace span                                       │
│     • Calculate total cost (tokens × model pricing)         │
│     • Send to Hipocap for visualization                     │
│     • Trigger alerts if anomalies detected                  │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
Frontend renders complete response
```

### 2.3 Component Responsibilities

#### Backend Services

| Service | Responsibility | Dependencies |
|---------|---------------|--------------|
| `CopilotService` | Main orchestration, LLM calls, loop control | LLMClient, ToolRegistry, PolicyEngine |
| `LLMClient` | Abstract LLM provider interface | Multiple provider SDKs |
| `HipocapClient` | Trace collection, security enforcement | Hipocap SDK |
| `ToolRegistry` | Tool registration, discovery, schema validation | None |
| `PolicyEngine` | Permission checking via RBAC integration | RBACService, DB |
| `ToolRunner` | Tool execution, error handling, idempotency | Existing services |
| `UIComposer` | Map tool outputs → Tambo component props | Tool results |
| `EventStreamer` | SSE stream management, event emission | asyncio |
| `ContextBuilder` | Extract context from request + database | DB, Request |
| `SecurityShield` | Prompt injection, PII detection (pre-Hipocap) | Pattern libraries |

---

## 3. Model-Agnostic LLM Integration

### 3.1 LLM Provider Interface

#### File: `backend/app/core/llm/base.py`

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List, AsyncIterator, Optional
from pydantic import BaseModel
from enum import Enum

class ModelCapability(str, Enum):
    """Model capability tiers for smart routing."""
    BASIC = "basic"           # Simple queries, cheap models (GPT-4o-mini, Haiku)
    STANDARD = "standard"     # Most tasks (GPT-4o, Sonnet)
    ADVANCED = "advanced"     # Complex reasoning (o1, Opus)
    VISION = "vision"         # Image understanding
    LONG_CONTEXT = "long_context"  # >100k tokens

class LLMMessage(BaseModel):
    """Standardized message format across providers."""
    role: str  # 'user', 'assistant', 'system', 'tool'
    content: str | List[Dict[str, Any]]  # Text or multimodal
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_call_id: Optional[str] = None

class LLMResponse(BaseModel):
    """Standardized response format."""
    content: str
    tool_calls: List[Dict[str, Any]] = []
    model: str
    usage: Dict[str, int]  # input_tokens, output_tokens, total_tokens
    finish_reason: str
    cost_usd: float

class LLMProvider(ABC):
    """
    Abstract base class for LLM providers.

    All providers must implement this interface for unified usage.
    """

    provider_name: str
    default_model: str
    supports_streaming: bool = True
    supports_tool_calling: bool = True

    @abstractmethod
    async def complete(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        model: Optional[str] = None
    ) -> LLMResponse:
        """
        Non-streaming completion.

        Args:
            messages: Conversation history
            tools: Available tools for function calling
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            model: Specific model override

        Returns:
            LLMResponse with content and metadata
        """
        pass

    @abstractmethod
    async def stream_complete(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        model: Optional[str] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Streaming completion.

        Yields:
            Dict with 'type' (token|tool_call|done) and 'data'
        """
        pass

    @abstractmethod
    def calculate_cost(self, usage: Dict[str, int], model: str) -> float:
        """
        Calculate cost in USD based on token usage.

        Args:
            usage: Token counts (input_tokens, output_tokens)
            model: Model identifier

        Returns:
            Cost in USD
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if provider is available.

        Returns:
            True if healthy, False otherwise
        """
        pass
```

### 3.2 Claude Provider Implementation

#### File: `backend/app/core/llm/providers/claude.py`

```python
from anthropic import AsyncAnthropic
from typing import List, Dict, Any, AsyncIterator, Optional
from app.core.llm.base import LLMProvider, LLMMessage, LLMResponse
from app.core.config import settings

class ClaudeProvider(LLMProvider):
    """
    Anthropic Claude provider implementation.
    """

    provider_name = "anthropic"
    default_model = "claude-opus-4-5-20251101"

    # Pricing per 1M tokens (as of 2026-02)
    PRICING = {
        "claude-opus-4-5-20251101": {"input": 15.00, "output": 75.00},
        "claude-sonnet-4-5-20250929": {"input": 3.00, "output": 15.00},
        "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.00},
    }

    def __init__(self, api_key: str = None):
        self.client = AsyncAnthropic(
            api_key=api_key or settings.ANTHROPIC_API_KEY
        )

    async def complete(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        model: Optional[str] = None
    ) -> LLMResponse:
        """Complete using Claude API."""

        # Convert to Anthropic format
        anthropic_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
            if msg.role != "system"
        ]

        # Extract system message
        system_message = next(
            (msg.content for msg in messages if msg.role == "system"),
            None
        )

        # Build request
        request = {
            "model": model or self.default_model,
            "messages": anthropic_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        if system_message:
            request["system"] = system_message

        if tools:
            request["tools"] = tools

        # Call API
        response = await self.client.messages.create(**request)

        # Parse tool calls
        tool_calls = []
        if response.stop_reason == "tool_use":
            for content_block in response.content:
                if content_block.type == "tool_use":
                    tool_calls.append({
                        "id": content_block.id,
                        "name": content_block.name,
                        "input": content_block.input
                    })

        # Extract text content
        text_content = ""
        for content_block in response.content:
            if hasattr(content_block, "text"):
                text_content += content_block.text

        # Calculate cost
        usage = {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "total_tokens": response.usage.input_tokens + response.usage.output_tokens
        }
        cost = self.calculate_cost(usage, response.model)

        return LLMResponse(
            content=text_content,
            tool_calls=tool_calls,
            model=response.model,
            usage=usage,
            finish_reason=response.stop_reason,
            cost_usd=cost
        )

    async def stream_complete(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        model: Optional[str] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream completion from Claude."""

        # Build request (same as complete)
        anthropic_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
            if msg.role != "system"
        ]

        system_message = next(
            (msg.content for msg in messages if msg.role == "system"),
            None
        )

        request = {
            "model": model or self.default_model,
            "messages": anthropic_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        if system_message:
            request["system"] = system_message

        if tools:
            request["tools"] = tools

        # Stream response
        async with self.client.messages.stream(**request) as stream:
            async for event in stream:
                if event.type == "content_block_delta":
                    if hasattr(event.delta, "text"):
                        yield {
                            "type": "token",
                            "data": {"token": event.delta.text}
                        }

                elif event.type == "content_block_start":
                    if event.content_block.type == "tool_use":
                        yield {
                            "type": "tool_call_start",
                            "data": {
                                "id": event.content_block.id,
                                "name": event.content_block.name
                            }
                        }

                elif event.type == "message_stop":
                    yield {
                        "type": "done",
                        "data": {
                            "usage": {
                                "input_tokens": stream.get_usage().input_tokens,
                                "output_tokens": stream.get_usage().output_tokens
                            }
                        }
                    }

    def calculate_cost(self, usage: Dict[str, int], model: str) -> float:
        """Calculate cost for Claude models."""
        pricing = self.PRICING.get(model, self.PRICING[self.default_model])

        input_cost = (usage["input_tokens"] / 1_000_000) * pricing["input"]
        output_cost = (usage["output_tokens"] / 1_000_000) * pricing["output"]

        return input_cost + output_cost

    async def health_check(self) -> bool:
        """Check Claude API health."""
        try:
            await self.complete(
                messages=[LLMMessage(role="user", content="ping")],
                max_tokens=10
            )
            return True
        except Exception:
            return False
```

### 3.3 OpenAI Provider Implementation

#### File: `backend/app/core/llm/providers/openai.py`

```python
from openai import AsyncOpenAI
from typing import List, Dict, Any, AsyncIterator, Optional
from app.core.llm.base import LLMProvider, LLMMessage, LLMResponse
from app.core.config import settings

class OpenAIProvider(LLMProvider):
    """
    OpenAI provider implementation (GPT-4, GPT-4o, o1, etc.)
    """

    provider_name = "openai"
    default_model = "gpt-4o-2024-11-20"

    # Pricing per 1M tokens (as of 2026-02)
    PRICING = {
        "gpt-4o-2024-11-20": {"input": 2.50, "output": 10.00},
        "gpt-4o-mini-2024-07-18": {"input": 0.15, "output": 0.60},
        "o1-2024-12-17": {"input": 15.00, "output": 60.00},
        "o1-mini-2024-09-12": {"input": 3.00, "output": 12.00},
    }

    def __init__(self, api_key: str = None):
        self.client = AsyncOpenAI(
            api_key=api_key or settings.OPENAI_API_KEY
        )

    async def complete(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        model: Optional[str] = None
    ) -> LLMResponse:
        """Complete using OpenAI API."""

        # Convert to OpenAI format
        openai_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

        # Build request
        request = {
            "model": model or self.default_model,
            "messages": openai_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        if tools:
            request["tools"] = [
                {"type": "function", "function": tool}
                for tool in tools
            ]

        # Call API
        response = await self.client.chat.completions.create(**request)

        message = response.choices[0].message

        # Parse tool calls
        tool_calls = []
        if message.tool_calls:
            for tc in message.tool_calls:
                tool_calls.append({
                    "id": tc.id,
                    "name": tc.function.name,
                    "input": json.loads(tc.function.arguments)
                })

        # Calculate cost
        usage = {
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
        cost = self.calculate_cost(usage, response.model)

        return LLMResponse(
            content=message.content or "",
            tool_calls=tool_calls,
            model=response.model,
            usage=usage,
            finish_reason=response.choices[0].finish_reason,
            cost_usd=cost
        )

    async def stream_complete(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        model: Optional[str] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream completion from OpenAI."""

        openai_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

        request = {
            "model": model or self.default_model,
            "messages": openai_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": True,
        }

        if tools:
            request["tools"] = [
                {"type": "function", "function": tool}
                for tool in tools
            ]

        stream = await self.client.chat.completions.create(**request)

        async for chunk in stream:
            delta = chunk.choices[0].delta

            if delta.content:
                yield {
                    "type": "token",
                    "data": {"token": delta.content}
                }

            if delta.tool_calls:
                for tc in delta.tool_calls:
                    yield {
                        "type": "tool_call_start",
                        "data": {
                            "id": tc.id,
                            "name": tc.function.name
                        }
                    }

            if chunk.choices[0].finish_reason:
                yield {
                    "type": "done",
                    "data": {
                        "usage": {
                            "input_tokens": chunk.usage.prompt_tokens if chunk.usage else 0,
                            "output_tokens": chunk.usage.completion_tokens if chunk.usage else 0
                        }
                    }
                }

    def calculate_cost(self, usage: Dict[str, int], model: str) -> float:
        """Calculate cost for OpenAI models."""
        pricing = self.PRICING.get(model, self.PRICING[self.default_model])

        input_cost = (usage["input_tokens"] / 1_000_000) * pricing["input"]
        output_cost = (usage["output_tokens"] / 1_000_000) * pricing["output"]

        return input_cost + output_cost

    async def health_check(self) -> bool:
        """Check OpenAI API health."""
        try:
            await self.complete(
                messages=[LLMMessage(role="user", content="ping")],
                max_tokens=10
            )
            return True
        except Exception:
            return False
```

### 3.4 LLM Client with Smart Routing

#### File: `backend/app/core/llm/client.py`

```python
from typing import List, Dict, Any, AsyncIterator, Optional
from app.core.llm.base import LLMProvider, LLMMessage, LLMResponse, ModelCapability
from app.core.llm.providers.claude import ClaudeProvider
from app.core.llm.providers.openai import OpenAIProvider
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class LLMClient:
    """
    Unified LLM client with multi-provider support and smart routing.
    """

    def __init__(self):
        self.providers: Dict[str, LLMProvider] = {}
        self.provider_fallback_chain: List[str] = []
        self._initialize_providers()

    def _initialize_providers(self):
        """Initialize all configured providers."""

        # Claude
        if settings.ANTHROPIC_API_KEY:
            self.providers["anthropic"] = ClaudeProvider(settings.ANTHROPIC_API_KEY)
            logger.info("Claude provider initialized")

        # OpenAI
        if settings.OPENAI_API_KEY:
            self.providers["openai"] = OpenAIProvider(settings.OPENAI_API_KEY)
            logger.info("OpenAI provider initialized")

        # Define fallback chain
        self.provider_fallback_chain = settings.LLM_PROVIDER_FALLBACK_CHAIN or [
            "anthropic",  # Primary: Claude
            "openai",     # Secondary: OpenAI
        ]

        logger.info(f"Provider fallback chain: {self.provider_fallback_chain}")

    def _select_provider_by_task(
        self,
        task_complexity: ModelCapability = ModelCapability.STANDARD,
        preferred_provider: Optional[str] = None
    ) -> str:
        """
        Select best provider based on task complexity.

        Routing logic:
        - BASIC: Use cheapest (GPT-4o-mini, Haiku)
        - STANDARD: Use reliable (GPT-4o, Sonnet)
        - ADVANCED: Use most capable (Claude Opus, o1)
        """

        if preferred_provider and preferred_provider in self.providers:
            return preferred_provider

        # Smart routing based on complexity
        if task_complexity == ModelCapability.BASIC:
            # Prefer cheap models
            if "openai" in self.providers:
                return "openai"  # Will use gpt-4o-mini

        elif task_complexity == ModelCapability.ADVANCED:
            # Prefer powerful models
            if "anthropic" in self.providers:
                return "anthropic"  # Will use Claude Opus

        # Default: use first available in fallback chain
        for provider_name in self.provider_fallback_chain:
            if provider_name in self.providers:
                return provider_name

        raise RuntimeError("No LLM providers available")

    async def complete(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        task_complexity: ModelCapability = ModelCapability.STANDARD,
        preferred_provider: Optional[str] = None,
        model_override: Optional[str] = None
    ) -> LLMResponse:
        """
        Complete with automatic provider selection and fallback.

        Args:
            messages: Conversation history
            tools: Available tools
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            task_complexity: Hint for model selection
            preferred_provider: Specific provider to use
            model_override: Specific model to use (overrides provider selection)

        Returns:
            LLMResponse from selected provider
        """

        provider_name = self._select_provider_by_task(task_complexity, preferred_provider)
        provider = self.providers[provider_name]

        try:
            logger.info(f"Using provider: {provider_name}, model: {model_override or provider.default_model}")

            response = await provider.complete(
                messages=messages,
                tools=tools,
                temperature=temperature,
                max_tokens=max_tokens,
                model=model_override
            )

            logger.info(
                f"Completed with {provider_name}: "
                f"{response.usage['total_tokens']} tokens, "
                f"${response.cost_usd:.4f}"
            )

            return response

        except Exception as e:
            logger.error(f"Provider {provider_name} failed: {e}")

            # Try fallback
            for fallback_name in self.provider_fallback_chain:
                if fallback_name == provider_name or fallback_name not in self.providers:
                    continue

                try:
                    logger.warning(f"Falling back to {fallback_name}")
                    fallback_provider = self.providers[fallback_name]

                    return await fallback_provider.complete(
                        messages=messages,
                        tools=tools,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )

                except Exception as fallback_error:
                    logger.error(f"Fallback {fallback_name} also failed: {fallback_error}")
                    continue

            raise RuntimeError(f"All providers failed. Last error: {e}")

    async def stream_complete(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        task_complexity: ModelCapability = ModelCapability.STANDARD,
        preferred_provider: Optional[str] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream completion with provider selection."""

        provider_name = self._select_provider_by_task(task_complexity, preferred_provider)
        provider = self.providers[provider_name]

        logger.info(f"Streaming from provider: {provider_name}")

        async for chunk in provider.stream_complete(
            messages=messages,
            tools=tools,
            temperature=temperature,
            max_tokens=max_tokens
        ):
            yield chunk


# Dependency injection factory
def get_llm_client() -> LLMClient:
    """Get LLM client instance."""
    return LLMClient()
```

### 3.5 Configuration

#### Add to `backend/app/core/config.py`:

```python
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # ... existing settings ...

    # LLM Provider API Keys
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_AI_API_KEY: Optional[str] = None  # For Gemini
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_ENDPOINT: Optional[str] = None

    # Provider Configuration
    LLM_PROVIDER_FALLBACK_CHAIN: List[str] = ["anthropic", "openai"]
    LLM_DEFAULT_MODEL: str = "claude-sonnet-4-5-20250929"
    LLM_CHEAP_MODEL: str = "gpt-4o-mini-2024-07-18"  # For simple tasks
    LLM_ADVANCED_MODEL: str = "claude-opus-4-5-20251101"  # For complex reasoning

    # Copilot-specific LLM settings
    COPILOT_MAX_TOKENS: int = 4096
    COPILOT_TEMPERATURE: float = 0.7
    COPILOT_ENABLE_STREAMING: bool = True
    COPILOT_TOOL_TIMEOUT_SECONDS: int = 60
```

---

## 4. Hipocap Observability Integration

### 4.1 Hipocap SDK Setup

#### File: `backend/app/core/hipocap/client.py`

```python
"""
Hipocap client for observability and security enforcement.

Since Hipocap documentation is limited, this is a conceptual implementation
based on typical LLM observability platform patterns.

Adjust based on actual Hipocap SDK once documentation becomes available.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
import httpx

logger = logging.getLogger(__name__)

class HipocapClient:
    """
    Client for Hipocap observability platform.

    Features:
    - Trace collection (reasoning chains, tool calls, latency)
    - Security monitoring (prompt injections, PII, toxic content)
    - Policy enforcement (function-level RBAC)
    - Cost tracking
    """

    def __init__(
        self,
        api_key: str,
        project_id: str,
        environment: str = "production",
        endpoint: str = "https://api.hipocap.com"
    ):
        self.api_key = api_key
        self.project_id = project_id
        self.environment = environment
        self.endpoint = endpoint
        self.http_client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {api_key}",
                "X-Project-ID": project_id,
                "X-Environment": environment
            }
        )

    async def start_trace(
        self,
        trace_id: str,
        user_id: str,
        session_id: str,
        metadata: Dict[str, Any] = None
    ) -> str:
        """
        Start a new trace for an agent execution.

        Returns:
            trace_id for subsequent span operations
        """
        try:
            response = await self.http_client.post(
                f"{self.endpoint}/v1/traces",
                json={
                    "trace_id": trace_id,
                    "user_id": user_id,
                    "session_id": session_id,
                    "started_at": datetime.utcnow().isoformat(),
                    "metadata": metadata or {}
                }
            )
            response.raise_for_status()
            logger.info(f"Hipocap trace started: {trace_id}")
            return trace_id

        except Exception as e:
            logger.error(f"Failed to start Hipocap trace: {e}")
            return trace_id  # Continue execution even if Hipocap fails

    async def log_llm_call(
        self,
        trace_id: str,
        provider: str,
        model: str,
        messages: List[Dict[str, Any]],
        response: Dict[str, Any],
        latency_ms: int,
        cost_usd: float,
        tools: Optional[List[Dict[str, Any]]] = None
    ):
        """
        Log an LLM API call.

        Hipocap will:
        - Detect PII in messages/response and mask in stored logs
        - Check for prompt injections
        - Calculate token usage and costs
        - Visualize reasoning chain
        """
        try:
            await self.http_client.post(
                f"{self.endpoint}/v1/traces/{trace_id}/llm_calls",
                json={
                    "timestamp": datetime.utcnow().isoformat(),
                    "provider": provider,
                    "model": model,
                    "messages": messages,  # Hipocap will sanitize PII
                    "response": response,
                    "latency_ms": latency_ms,
                    "cost_usd": cost_usd,
                    "tools": tools or []
                }
            )
            logger.debug(f"Logged LLM call to Hipocap: {provider}/{model}")

        except Exception as e:
            logger.error(f"Failed to log LLM call to Hipocap: {e}")

    async def log_tool_call(
        self,
        trace_id: str,
        tool_name: str,
        tool_input: Dict[str, Any],
        tool_output: Dict[str, Any],
        status: str,
        latency_ms: int,
        error: Optional[str] = None
    ):
        """
        Log a tool execution.

        Hipocap will:
        - Track tool call graph
        - Measure latency per tool
        - Identify errors and patterns
        """
        try:
            await self.http_client.post(
                f"{self.endpoint}/v1/traces/{trace_id}/tool_calls",
                json={
                    "timestamp": datetime.utcnow().isoformat(),
                    "tool_name": tool_name,
                    "input": tool_input,  # Sanitized by Hipocap
                    "output": tool_output,
                    "status": status,  # success, failed, cancelled
                    "latency_ms": latency_ms,
                    "error": error
                }
            )
            logger.debug(f"Logged tool call to Hipocap: {tool_name}")

        except Exception as e:
            logger.error(f"Failed to log tool call to Hipocap: {e}")

    async def check_security(
        self,
        trace_id: str,
        user_input: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Security check on user input BEFORE sending to LLM.

        Hipocap will check for:
        - Prompt injections (jailbreak attempts)
        - Toxic/harmful content
        - Sensitive keywords leakage attempts

        Returns:
            {
                "safe": bool,
                "violations": [{"type": "prompt_injection", "confidence": 0.95}],
                "sanitized_input": str  # If safe=True
            }
        """
        try:
            response = await self.http_client.post(
                f"{self.endpoint}/v1/security/check",
                json={
                    "trace_id": trace_id,
                    "input": user_input,
                    "context": context
                }
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"Hipocap security check failed: {e}")
            # Fail open: allow request but log
            return {
                "safe": True,
                "violations": [],
                "sanitized_input": user_input
            }

    async def enforce_function_rbac(
        self,
        trace_id: str,
        user_id: str,
        function_name: str,
        permissions: List[str]
    ) -> bool:
        """
        Enforce function-level RBAC via Hipocap.

        Returns:
            True if user is authorized, False otherwise
        """
        try:
            response = await self.http_client.post(
                f"{self.endpoint}/v1/rbac/check",
                json={
                    "trace_id": trace_id,
                    "user_id": user_id,
                    "function": function_name,
                    "required_permissions": permissions
                }
            )
            response.raise_for_status()
            result = response.json()
            return result.get("authorized", False)

        except Exception as e:
            logger.error(f"Hipocap RBAC check failed: {e}")
            # Fail closed: deny access if Hipocap unavailable
            return False

    async def close_trace(
        self,
        trace_id: str,
        status: str,
        total_cost_usd: float,
        metadata: Dict[str, Any] = None
    ):
        """
        Close a trace with final status and metrics.
        """
        try:
            await self.http_client.patch(
                f"{self.endpoint}/v1/traces/{trace_id}",
                json={
                    "completed_at": datetime.utcnow().isoformat(),
                    "status": status,  # success, error, cancelled
                    "total_cost_usd": total_cost_usd,
                    "metadata": metadata or {}
                }
            )
            logger.info(f"Hipocap trace closed: {trace_id}, status={status}")

        except Exception as e:
            logger.error(f"Failed to close Hipocap trace: {e}")

    async def health_check(self) -> bool:
        """Check Hipocap service health."""
        try:
            response = await self.http_client.get(f"{self.endpoint}/health")
            return response.status_code == 200
        except Exception:
            return False


# Dependency injection
_hipocap_client = None

def get_hipocap_client() -> Optional[HipocapClient]:
    """Get Hipocap client instance."""
    global _hipocap_client

    from app.core.config import settings

    if not settings.HIPOCAP_API_KEY:
        logger.warning("Hipocap not configured (no API key)")
        return None

    if _hipocap_client is None:
        _hipocap_client = HipocapClient(
            api_key=settings.HIPOCAP_API_KEY,
            project_id=settings.HIPOCAP_PROJECT_ID,
            environment=settings.HIPOCAP_ENVIRONMENT
        )

    return _hipocap_client
```

### 4.2 Add Hipocap Config

#### Update `backend/app/core/config.py`:

```python
class Settings(BaseSettings):
    # ... existing settings ...

    # Hipocap Observability
    HIPOCAP_API_KEY: Optional[str] = None
    HIPOCAP_PROJECT_ID: str = "erp2025-copilot"
    HIPOCAP_ENVIRONMENT: str = "production"  # development, staging, production
    HIPOCAP_ENDPOINT: str = "https://api.hipocap.com"

    # Security enforcement via Hipocap
    HIPOCAP_ENABLE_SECURITY_CHECKS: bool = True
    HIPOCAP_ENABLE_FUNCTION_RBAC: bool = True
    HIPOCAP_ENABLE_PII_MASKING: bool = True
```

### 4.3 Integration in CopilotService

The CopilotService will wrap all LLM calls and tool executions with Hipocap tracing:

```python
# Pseudo-code showing Hipocap integration flow
async def handle_message(self, user_id, message, conversation_id):
    trace_id = str(uuid.uuid4())

    # Start Hipocap trace
    if self.hipocap:
        await self.hipocap.start_trace(
            trace_id=trace_id,
            user_id=user_id,
            session_id=conversation_id,
            metadata={"route": context.route}
        )

    try:
        # Security check via Hipocap
        if self.hipocap:
            security_result = await self.hipocap.check_security(
                trace_id, message, context
            )
            if not security_result["safe"]:
                return {"error": "Security violation detected"}

        # LLM call
        start = time.time()
        llm_response = await self.llm_client.complete(messages, tools)
        latency_ms = int((time.time() - start) * 1000)

        # Log to Hipocap
        if self.hipocap:
            await self.hipocap.log_llm_call(
                trace_id,
                provider="anthropic",
                model=llm_response.model,
                messages=[...],
                response=llm_response.dict(),
                latency_ms=latency_ms,
                cost_usd=llm_response.cost_usd
            )

        # Execute tools
        for tool_call in llm_response.tool_calls:
            # Function-level RBAC via Hipocap
            if self.hipocap:
                authorized = await self.hipocap.enforce_function_rbac(
                    trace_id, user_id, tool_call.name, [...]
                )
                if not authorized:
                    continue

            # Execute tool
            start = time.time()
            result = await self.tool_runner.execute(tool_call)
            latency_ms = int((time.time() - start) * 1000)

            # Log to Hipocap
            if self.hipocap:
                await self.hipocap.log_tool_call(
                    trace_id,
                    tool_name=tool_call.name,
                    tool_input=tool_call.input,
                    tool_output=result,
                    status="success",
                    latency_ms=latency_ms
                )

        # Close trace
        if self.hipocap:
            await self.hipocap.close_trace(
                trace_id,
                status="success",
                total_cost_usd=total_cost
            )

    except Exception as e:
        if self.hipocap:
            await self.hipocap.close_trace(trace_id, status="error")
        raise
```

---

## 5. Database Schema Design

### 5.1 New Tables (SQL Server)

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
    cpc_total_cost_usd DECIMAL(10, 4) DEFAULT 0.0,     -- Cumulative cost
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

    -- LLM metadata
    cpm_model VARCHAR(100),                            -- e.g., "claude-opus-4-5", "gpt-4o"
    cpm_provider VARCHAR(50),                          -- e.g., "anthropic", "openai"
    cpm_token_count INT,
    cpm_cost_usd DECIMAL(10, 6),

    -- Metadata
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

    -- Hipocap trace reference
    tcl_hipocap_trace_id VARCHAR(100),

    -- User/tenant
    usr_id INT NOT NULL FOREIGN KEY REFERENCES TM_USR_User(usr_id),
    soc_id INT NOT NULL FOREIGN KEY REFERENCES TR_SOC_Society(soc_id),

    INDEX idx_conversation (cpc_id, tcl_started_at),
    INDEX idx_status (tcl_status),
    INDEX idx_user (usr_id, tcl_started_at DESC),
    INDEX idx_idempotency (tcl_idempotency_key) WHERE tcl_idempotency_key IS NOT NULL,
    INDEX idx_hipocap_trace (tcl_hipocap_trace_id)
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
    apr_required_role_level INT,                       -- Minimum role level
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
    uib_interaction_result NVARCHAR(MAX),              -- Result of interaction

    -- Metadata
    uib_created_at DATETIME2 DEFAULT GETDATE(),

    INDEX idx_conversation (cpc_id, uib_created_at),
    INDEX idx_message (cpm_id)
);
```

---

## 6. Backend Implementation

### 6.1 CopilotService with Hipocap Integration

#### File: `backend/app/services/copilot_service.py`

```python
from typing import Dict, Any, List, Optional, AsyncIterator
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import time
import json
import logging

from app.core.llm.client import LLMClient
from app.core.llm.base import LLMMessage, ModelCapability
from app.core.hipocap.client import HipocapClient, get_hipocap_client
from app.services.tool_registry import ToolRegistry, get_tool_registry
from app.services.policy_engine import PolicyEngine, get_policy_engine
from app.services.tool_runner import ToolRunner
from app.models.copilot import (
    CopilotConversation,
    CopilotMessage,
    ToolCallLog
)
from app.core.config import settings

logger = logging.getLogger(__name__)

class CopilotService:
    """
    Main Copilot orchestration service.

    Handles:
    - Agent loop execution
    - LLM provider coordination
    - Tool execution
    - Hipocap observability integration
    - Streaming events
    """

    def __init__(
        self,
        db: Session,
        llm_client: LLMClient,
        tool_registry: ToolRegistry,
        policy_engine: PolicyEngine,
        hipocap_client: Optional[HipocapClient] = None
    ):
        self.db = db
        self.llm = llm_client
        self.tools = tool_registry
        self.policy = policy_engine
        self.hipocap = hipocap_client
        self.tool_runner = ToolRunner(db, tool_registry)

    async def handle_message(
        self,
        user_id: int,
        message: str,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Handle incoming user message.

        Returns:
            {
                "conversation_id": str,
                "message_id": str,
                "requires_stream": bool
            }
        """

        # Get or create conversation
        conversation = self._get_or_create_conversation(
            user_id, conversation_id, context
        )

        # Save user message
        user_msg = CopilotMessage(
            cpm_uuid=str(uuid.uuid4()),
            cpc_id=conversation.cpc_id,
            cpm_role="user",
            cpm_content=message
        )
        self.db.add(user_msg)
        self.db.commit()

        # Start Hipocap trace
        trace_id = str(uuid.uuid4())
        if self.hipocap:
            await self.hipocap.start_trace(
                trace_id=trace_id,
                user_id=str(user_id),
                session_id=conversation.cpc_uuid,
                metadata={
                    "route": context.get("route") if context else None,
                    "entity_type": context.get("entity_type") if context else None
                }
            )

        return {
            "conversation_id": conversation.cpc_uuid,
            "message_id": user_msg.cpm_uuid,
            "requires_stream": True,
            "trace_id": trace_id
        }

    async def stream_response(
        self,
        conversation_id: str,
        user_id: int,
        trace_id: str
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Stream assistant response via SSE.

        Yields:
            SSE events: token, tool_call_started, tool_call_result, ui_block, done
        """

        # Load conversation
        conversation = (
            self.db.query(CopilotConversation)
            .filter_by(cpc_uuid=conversation_id)
            .first()
        )

        if not conversation:
            yield {"type": "error", "data": {"error": "Conversation not found"}}
            return

        # Security check via Hipocap
        last_message = conversation.messages[-1].cpm_content
        if self.hipocap and settings.HIPOCAP_ENABLE_SECURITY_CHECKS:
            security_result = await self.hipocap.check_security(
                trace_id,
                last_message,
                context=json.loads(conversation.cpc_context_json or "{}")
            )

            if not security_result["safe"]:
                violations = security_result.get("violations", [])
                yield {
                    "type": "error",
                    "data": {
                        "error": "Security violation detected",
                        "violations": violations
                    }
                }
                return

        # Build context
        context_data = self._build_context(conversation, user_id)

        # Build messages for LLM
        messages = self._build_llm_messages(conversation, context_data)

        # Get user's available tools
        available_tools = self.tools.get_user_tools(
            user_id,
            context_data["role_id"]
        )

        # LLM call (streaming)
        total_cost = 0.0
        assistant_content = ""
        tool_calls = []

        start_time = time.time()

        try:
            async for chunk in self.llm.stream_complete(
                messages=messages,
                tools=available_tools,
                task_complexity=ModelCapability.STANDARD
            ):
                if chunk["type"] == "token":
                    token = chunk["data"]["token"]
                    assistant_content += token
                    yield {"type": "token", "data": {"token": token}}

                elif chunk["type"] == "tool_call_start":
                    tool_call = chunk["data"]
                    tool_calls.append(tool_call)

                    # Validate with PolicyEngine
                    can_execute = await self.policy.can_execute_tool(
                        user_id,
                        tool_call["name"],
                        tool_call.get("input", {})
                    )

                    if not can_execute:
                        yield {
                            "type": "tool_call_blocked",
                            "data": {
                                "tool_name": tool_call["name"],
                                "reason": "Insufficient permissions"
                            }
                        }
                        continue

                    # Check if requires approval
                    tool_def = self.tools.get_tool(tool_call["name"])
                    if tool_def.side_effect_level in ["external", "financial"]:
                        yield {
                            "type": "tool_requires_approval",
                            "data": {
                                "tool_call_id": tool_call["id"],
                                "tool_name": tool_call["name"],
                                "tool_input": tool_call["input"],
                                "side_effect_level": tool_def.side_effect_level
                            }
                        }
                        # Wait for confirmation (handled via separate endpoint)
                        continue

                    # Execute tool
                    yield {
                        "type": "tool_call_started",
                        "data": {
                            "tool_call_id": tool_call["id"],
                            "tool_name": tool_call["name"]
                        }
                    }

                    tool_start = time.time()
                    tool_result = await self.tool_runner.execute(
                        tool_name=tool_call["name"],
                        tool_input=tool_call["input"],
                        user_id=user_id
                    )
                    tool_latency_ms = int((time.time() - tool_start) * 1000)

                    # Log to Hipocap
                    if self.hipocap:
                        await self.hipocap.log_tool_call(
                            trace_id=trace_id,
                            tool_name=tool_call["name"],
                            tool_input=tool_call["input"],
                            tool_output=tool_result,
                            status="success" if tool_result.get("success") else "failed",
                            latency_ms=tool_latency_ms,
                            error=tool_result.get("error")
                        )

                    # Save to database
                    self._save_tool_call_log(
                        conversation.cpc_id,
                        user_id,
                        tool_call,
                        tool_result,
                        tool_latency_ms,
                        trace_id
                    )

                    yield {
                        "type": "tool_call_result",
                        "data": {
                            "tool_call_id": tool_call["id"],
                            "tool_name": tool_call["name"],
                            "result": tool_result
                        }
                    }

                elif chunk["type"] == "done":
                    usage = chunk["data"]["usage"]

                    # Log to Hipocap
                    latency_ms = int((time.time() - start_time) * 1000)
                    if self.hipocap:
                        await self.hipocap.log_llm_call(
                            trace_id=trace_id,
                            provider="anthropic",  # TODO: get from LLM client
                            model="claude-sonnet-4-5",  # TODO: get from response
                            messages=[m.dict() for m in messages],
                            response={"content": assistant_content, "tool_calls": tool_calls},
                            latency_ms=latency_ms,
                            cost_usd=0.0,  # TODO: calculate
                            tools=available_tools
                        )

            # Save assistant message
            assistant_msg = CopilotMessage(
                cpm_uuid=str(uuid.uuid4()),
                cpc_id=conversation.cpc_id,
                cpm_role="assistant",
                cpm_content=assistant_content,
                cpm_token_count=usage.get("total_tokens", 0),
                cpm_cost_usd=total_cost
            )
            self.db.add(assistant_msg)
            self.db.commit()

            # Close Hipocap trace
            if self.hipocap:
                await self.hipocap.close_trace(
                    trace_id=trace_id,
                    status="success",
                    total_cost_usd=total_cost
                )

            yield {"type": "done", "data": {}}

        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)

            if self.hipocap:
                await self.hipocap.close_trace(
                    trace_id=trace_id,
                    status="error",
                    total_cost_usd=total_cost
                )

            yield {"type": "error", "data": {"error": str(e)}}

    def _build_context(
        self,
        conversation: CopilotConversation,
        user_id: int
    ) -> Dict[str, Any]:
        """Build context for system prompt."""
        # Load user permissions, business units, etc.
        # TODO: Implement full context building
        return {
            "user_id": user_id,
            "role_id": 1,  # TODO: Get from user
            "society_id": conversation.soc_id,
            "business_unit_id": conversation.bu_id
        }

    def _build_llm_messages(
        self,
        conversation: CopilotConversation,
        context: Dict[str, Any]
    ) -> List[LLMMessage]:
        """Build message history for LLM."""
        messages = []

        # System prompt
        system_prompt = self._build_system_prompt(context)
        messages.append(LLMMessage(role="system", content=system_prompt))

        # Conversation history
        for msg in conversation.messages:
            messages.append(
                LLMMessage(
                    role=msg.cpm_role,
                    content=msg.cpm_content
                )
            )

        return messages

    def _build_system_prompt(self, context: Dict[str, Any]) -> str:
        """Build system prompt with context."""
        # TODO: Implement comprehensive system prompt
        return f"""You are an AI assistant for an ERP system.

User Context:
- User ID: {context['user_id']}
- Society ID: {context['society_id']}
- Business Unit: {context.get('business_unit_id', 'N/A')}

You have access to various tools to help manage business operations.
Always use the appropriate tool to fulfill user requests.
"""

    def _save_tool_call_log(
        self,
        conversation_id: int,
        user_id: int,
        tool_call: Dict[str, Any],
        result: Dict[str, Any],
        latency_ms: int,
        trace_id: str
    ):
        """Save tool call to audit log."""
        log = ToolCallLog(
            tcl_uuid=str(uuid.uuid4()),
            cpc_id=conversation_id,
            usr_id=user_id,
            soc_id=1,  # TODO: Get from context
            tcl_tool_name=tool_call["name"],
            tcl_input_args=json.dumps(tool_call.get("input", {})),
            tcl_output_result=json.dumps(result),
            tcl_status="success" if result.get("success") else "failed",
            tcl_duration_ms=latency_ms,
            tcl_hipocap_trace_id=trace_id
        )
        self.db.add(log)
        self.db.commit()

    def _get_or_create_conversation(
        self,
        user_id: int,
        conversation_id: Optional[str],
        context: Optional[Dict[str, Any]]
    ) -> CopilotConversation:
        """Get existing or create new conversation."""

        if conversation_id:
            conv = (
                self.db.query(CopilotConversation)
                .filter_by(cpc_uuid=conversation_id)
                .first()
            )
            if conv:
                return conv

        # Create new
        conv = CopilotConversation(
            cpc_uuid=str(uuid.uuid4()),
            usr_id=user_id,
            soc_id=context.get("soc_id", 1) if context else 1,
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


# Dependency injection factory
def get_copilot_service(db: Session) -> CopilotService:
    """Get CopilotService instance with all dependencies."""
    from app.core.llm.client import get_llm_client

    return CopilotService(
        db=db,
        llm_client=get_llm_client(),
        tool_registry=get_tool_registry(),
        policy_engine=get_policy_engine(db),
        hipocap_client=get_hipocap_client()
    )
```

---

**[CONTINUED IN NEXT SECTION DUE TO LENGTH...]**

This plan continues with:
- Section 7: Security & RBAC Integration
- Section 8: Tool Registry & Execution
- Section 9: Frontend Implementation
- Section 10: Generative UI with Tambo
- Section 11: Streaming Architecture
- Section 12: Implementation Roadmap
- Section 13: Testing Strategy
- Section 14: Production Deployment

Would you like me to continue with the remaining sections?
