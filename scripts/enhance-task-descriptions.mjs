#!/usr/bin/env node
/**
 * Enhance task descriptions with proper context from refactor docs
 * 
 * This script adds:
 * - Critical constraints (SQL Server, no migrations)
 * - Relevant table/column references
 * - Business logic rules
 * - File path patterns
 * - Reference doc links
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FEATURES_DIR = path.join(PROJECT_ROOT, '.automaker', 'features');
const REFACTOR_DIR = path.join(PROJECT_ROOT, 'Refactor');

// Critical constraints that apply to ALL tasks
const CRITICAL_CONSTRAINTS = `
## ⚠️ CRITICAL CONSTRAINTS

1. **Database**: Use EXISTING SQL Server - NO schema migrations, NO Alembic
2. **Table Names**: Use EXACT names (TM_CLI_Client, TR_STA_Status, etc.)
3. **Column Names**: Use EXACT column names from existing schema
4. **IDs**: INT IDENTITY (not UUID)
5. **Patterns**: Follow existing codebase patterns in \`backend/app/\`

## 📚 Reference Documentation

- **Database Schema**: \`Refactor/reference/database-schema.md\`
- **Business Logic**: \`Refactor/reference/business-logic.md\`
- **Frontend Modules**: \`Refactor/reference/frontend-modules.md\`
- **API Patterns**: \`Refactor/reference/frontend-integration.md\`
`;

// Context templates for different task types
const TASK_CONTEXT = {
  // Models
  'Create.*model': {
    context: `
## Model Requirements

- Use SQLAlchemy 2.0 declarative syntax
- Map to EXISTING table (check \`Refactor/reference/database-schema.md\`)
- Use \`__tablename__\` with exact SQL Server table name
- All columns must match existing schema exactly
- Define relationships with \`relationship()\` and \`ForeignKey\`

## Example Pattern
\`\`\`python
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Client(Base):
    __tablename__ = "TM_CLI_Client"
    
    id = Column("cli_id", Integer, primary_key=True)
    company_name = Column("cli_company_name", String(200))
    # ... map all columns from schema
\`\`\`
`,
  },
  
  // Schemas
  'Create.*schema': {
    context: `
## Schema Requirements

- Use Pydantic v2 syntax
- Create separate schemas: \`Create\`, \`Update\`, \`Response\`, \`List\`
- Match field names to frontend expectations
- Add validation where needed

## Example Pattern
\`\`\`python
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ClientBase(BaseModel):
    company_name: str
    email: str | None = None

class ClientCreate(ClientBase):
    pass

class ClientResponse(ClientBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    reference: str
    created_at: datetime
\`\`\`
`,
  },
  
  // Services
  'Create.*service': {
    context: `
## Service Requirements

- Implement business logic from \`Refactor/reference/business-logic.md\`
- Use repository pattern for database access
- Handle transactions properly
- Implement reference generation patterns (CLI-0001, ORD-2024-0001, etc.)

## Example Pattern
\`\`\`python
from sqlalchemy.orm import Session
from app.models import Client
from app.schemas.client import ClientCreate

class ClientService:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, data: ClientCreate) -> Client:
        reference = self._generate_reference()
        client = Client(**data.model_dump(), reference=reference)
        self.db.add(client)
        self.db.commit()
        return client
    
    def _generate_reference(self) -> str:
        # See business-logic.md for pattern
        pass
\`\`\`
`,
  },
  
  // API endpoints
  'Create.*api|GET.*api|POST.*api|PUT.*api|PATCH.*api|DELETE.*api': {
    context: `
## API Requirements

- Use FastAPI router with proper tags
- Implement pagination for list endpoints (page, pageSize, totalCount)
- Use dependency injection for db session and current user
- Return consistent response format

## Example Pattern
\`\`\`python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user

router = APIRouter(prefix="/api/v1/clients", tags=["clients"])

@router.get("")
async def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Implement with pagination
    pass
\`\`\`
`,
  },
  
  // SQL scripts
  'Create.*SQL|sql': {
    context: `
## SQL Script Requirements

- Place in \`/SQL/V1.0.0.4/\` folder
- Use IF NOT EXISTS for safety
- Follow existing naming conventions (TM_*, TR_*)
- Add proper indexes and constraints

## Example Pattern
\`\`\`sql
-- Only for NEW tables, not modifying existing ones
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TM_NEW_Table')
BEGIN
    CREATE TABLE TM_NEW_Table (
        Id INT PRIMARY KEY IDENTITY,
        -- columns
    )
END
\`\`\`
`,
  },
  
  // Frontend pages
  'Create.*/.*page|Create.*component': {
    context: `
## Frontend Requirements

- Use React 18 + TypeScript
- Use TanStack Query for data fetching
- Use Zustand for state management
- Use shadcn/ui components
- Use Tailwind CSS for styling

## Example Pattern
\`\`\`tsx
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';

export function ClientsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.clients.list()
  });
  
  if (isLoading) return <LoadingSkeleton />;
  return <DataTable data={data} columns={columns} />;
}
\`\`\`
`,
  },
  
  // PDF generation
  'PDF|pdf': {
    context: `
## PDF Requirements

- Use WeasyPrint for PDF generation
- Store PDFs in MinIO/S3
- Use Jinja2 templates in \`backend/app/templates/\`
- Include company logo, line items, totals

## Reference
See \`Refactor/reference/business-logic.md\` for document total calculations.
`,
  },
  
  // Integrations
  'Shopify|shopify': {
    context: `
## Shopify Integration Requirements

- Use OAuth 2.0 for authentication
- Verify HMAC for webhooks
- Use GraphQL Admin API
- Implement rate limiting and retry logic
- Store tokens encrypted in database

## Tables
- TM_INT_ShopifyStore
- TM_INT_ShopifyLocationMap
- TM_INT_ShopifySyncCursor
`,
  },
  
  // Sage X3
  'X3|x3|Sage': {
    context: `
## Sage X3 Integration Requirements

- Export invoices/payments as CSV files
- Use X3 import format (X3_SIH_H, X3_SIH_L, X3_PAY)
- Map ERP entities to X3 codes
- Generate ZIP archives for batch exports

## Tables
- TM_INT_X3CustomerMap
- TM_INT_X3ProductMap
`,
  },
};

// Table references for specific entities
const TABLE_REFERENCES = {
  'client': 'TM_CLI_Client (cli_id, cli_reference, cli_company_name, cli_email, cli_phone, cli_address, cli_city, cli_postal_code, cli_country_id, cli_vat_number, cli_credit_limit, cli_payment_term_id, cli_status_id)',
  'contact': 'TM_CLI_ClientContact (cco_id, cco_client_id, cco_first_name, cco_last_name, cco_email, cco_phone, cco_is_primary)',
  'product': 'TM_PRD_Product (prd_id, prd_reference, prd_name, prd_description, prd_category_id, prd_brand_id, prd_unit_price, prd_cost_price, prd_vat_rate_id, prd_is_active)',
  'quote': 'TM_CP_CostPlan (cp_id, cp_reference, cp_client_id, cp_date, cp_validity_date, cp_status_id, cp_total_ht, cp_total_vat, cp_total_ttc)',
  'order': 'TM_ORD_ClientOrder (ord_id, ord_reference, ord_client_id, ord_date, ord_status_id, ord_total_ht, ord_total_vat, ord_total_ttc)',
  'invoice': 'TM_INV_ClientInvoice (inv_id, inv_reference, inv_client_id, inv_order_id, inv_date, inv_due_date, inv_status_id, inv_total_ht, inv_total_vat, inv_total_ttc)',
  'supplier': 'TM_SUP_Supplier (sup_id, sup_reference, sup_company_name, sup_email, sup_phone, sup_country_id)',
  'warehouse': 'TR_WH_Warehouse (wh_id, wh_code, wh_name, wh_address)',
  'stock': 'TM_STK_Stock (stk_id, stk_product_id, stk_warehouse_id, stk_quantity, stk_reserved_quantity)',
  'delivery': 'TM_DEL_DeliveryForm (del_id, del_reference, del_order_id, del_date, del_status_id)',
  'shipment': 'TM_LOG_Shipment (shp_id, shp_reference, shp_carrier_id, shp_tracking_number)',
  'payment': 'TM_PAY_Payment (pay_id, pay_reference, pay_client_id, pay_amount, pay_date, pay_mode_id)',
  'user': 'TM_USR_User (usr_id, usr_email, usr_password_hash, usr_first_name, usr_last_name, usr_role_id, usr_is_active)',
  'lookup': 'TR_* tables (TR_COU_Country, TR_CUR_Currency, TR_VAT_VatRate, TR_PAY_PaymentMode, TR_PAY_PaymentTerm, TR_STA_Status, TR_BU_BusinessUnit, TR_CT_ClientType, TR_CAT_Category, TR_BRA_Brand, TR_WH_Warehouse, TR_CAR_Carrier, TR_UOM_UnitOfMeasure)',
};

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

function getContextForTask(title, description) {
  let context = '';
  
  // Find matching context template
  for (const [pattern, config] of Object.entries(TASK_CONTEXT)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(title) || regex.test(description)) {
      context += config.context;
      break;
    }
  }
  
  // Add relevant table references
  for (const [entity, tableRef] of Object.entries(TABLE_REFERENCES)) {
    if (title.toLowerCase().includes(entity) || description.toLowerCase().includes(entity)) {
      context += `\n## Relevant Table\n\`${tableRef}\`\n`;
      break;
    }
  }
  
  return context;
}

async function enhanceFeature(feature) {
  const title = feature.title || '';
  const currentDesc = feature.description || '';
  
  // Skip if already enhanced
  if (currentDesc.includes('CRITICAL CONSTRAINTS')) {
    return false;
  }
  
  // Get task-specific context
  const taskContext = getContextForTask(title, currentDesc);
  
  // Build enhanced description
  const enhancedDesc = `${title}

${CRITICAL_CONSTRAINTS}
${taskContext}
---

**Original Task**: ${currentDesc.split('\n')[0]}
**Source**: ${feature.category || 'Unknown'}
**Effort**: ${(feature.tags || []).find(t => ['small', 'medium', 'large'].includes(t)) || 'medium'}
`;

  feature.description = enhancedDesc;
  
  // Save
  const featurePath = path.join(FEATURES_DIR, feature._dir, 'feature.json');
  const toSave = { ...feature };
  delete toSave._dir;
  await fs.writeFile(featurePath, JSON.stringify(toSave, null, 2));
  
  return true;
}

async function main() {
  console.log('🔧 Enhancing task descriptions with refactor context...\n');
  
  const features = await loadAllFeatures();
  const pending = features.filter(f => 
    f.status === 'pending' || f.status === 'backlog' || f.status === 'in_progress'
  );
  
  console.log(`📋 Tasks to enhance: ${pending.length}\n`);
  
  let enhanced = 0;
  let skipped = 0;
  
  for (const feature of pending) {
    const wasEnhanced = await enhanceFeature(feature);
    if (wasEnhanced) {
      enhanced++;
      console.log(`✓ Enhanced: ${feature.title?.substring(0, 50)}`);
    } else {
      skipped++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Enhancement Complete!');
  console.log(`   Enhanced: ${enhanced}`);
  console.log(`   Skipped (already enhanced): ${skipped}`);
}

main().catch(console.error);
