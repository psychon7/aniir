"""
Standalone test for Client API - bypasses all model relationship issues.
"""
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import asyncio
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, create_engine, func
from sqlalchemy.orm import Session, sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "")
print(f"DATABASE_URL: {DATABASE_URL[:50]}...")

# Create engine with pymssql
connect_args = {"tds_version": "7.0"}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base model
Base = declarative_base()


class Client(Base):
    """Minimal Client model matching actual DB columns."""
    __tablename__ = "TM_CLI_Client"
    __table_args__ = {'extend_existing': True}

    cli_id = Column(Integer, primary_key=True, autoincrement=True)
    cli_ref = Column(String(50), nullable=True)
    cli_company_name = Column(String(200), nullable=True)
    cli_email = Column(String(100), nullable=True)
    cli_city = Column(String(100), nullable=True)
    cli_isactive = Column(Boolean, nullable=True, default=True)
    cli_address1 = Column(String(200), nullable=True)
    cli_tel1 = Column(String(30), nullable=True)
    cli_postcode = Column(String(20), nullable=True)
    cli_d_creation = Column(DateTime, nullable=True)
    soc_id = Column(Integer, nullable=True)
    cur_id = Column(Integer, nullable=True)


class ClientResponse(BaseModel):
    """Pydantic schema for Client response - matches frontend expectations."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    reference: Optional[str] = None
    companyName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    postalCode: Optional[str] = None
    isActive: bool = True
    createdAt: Optional[str] = None
    statusId: int = 1
    statusName: str = "Active"
    currencyId: int = 1
    currencyCode: str = "EUR"
    societyId: int = 1
    societyName: str = "Default"


class PagedResponse(BaseModel):
    """Paged response matching frontend expectations."""
    success: bool = True
    data: List[ClientResponse]
    page: int
    pageSize: int
    totalCount: int
    totalPages: int
    hasNextPage: bool
    hasPreviousPage: bool


def client_to_response(client: Client) -> ClientResponse:
    """Convert DB model to response schema."""
    return ClientResponse(
        id=client.cli_id,
        reference=client.cli_ref,
        companyName=client.cli_company_name,
        email=client.cli_email,
        phone=client.cli_tel1,
        city=client.cli_city,
        address=client.cli_address1,
        postalCode=client.cli_postcode,
        isActive=client.cli_isactive if client.cli_isactive is not None else True,
        createdAt=client.cli_d_creation.isoformat() if client.cli_d_creation else None,
        statusId=1,
        statusName="Active" if client.cli_isactive else "Inactive",
        currencyId=client.cur_id or 1,
        currencyCode="EUR",
        societyId=client.soc_id or 1,
        societyName="ECOLED"
    )


# Create FastAPI app
app = FastAPI(title="ERP Client API Test", version="1.0.0")

# CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
async def root():
    return {"message": "ERP Client API Test is running!"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/api/v1/clients", response_model=PagedResponse)
async def list_clients(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List clients from database with pagination."""
    def _fetch_clients():
        query = db.query(Client)
        
        # Apply search filter
        if search:
            query = query.filter(
                (Client.cli_company_name.ilike(f"%{search}%")) |
                (Client.cli_ref.ilike(f"%{search}%")) |
                (Client.cli_email.ilike(f"%{search}%"))
            )
        
        # Get total count
        total_count = query.count()
        
        # Calculate pagination
        total_pages = (total_count + pageSize - 1) // pageSize
        skip = (page - 1) * pageSize
        
        # SQL Server requires ORDER BY when using OFFSET/LIMIT
        clients = query.order_by(Client.cli_id).offset(skip).limit(pageSize).all()
        
        return clients, total_count, total_pages
    
    clients, total_count, total_pages = await asyncio.to_thread(_fetch_clients)
    
    return PagedResponse(
        success=True,
        data=[client_to_response(c) for c in clients],
        page=page,
        pageSize=pageSize,
        totalCount=total_count,
        totalPages=total_pages,
        hasNextPage=page < total_pages,
        hasPreviousPage=page > 1
    )


@app.get("/api/v1/clients/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific client."""
    def _fetch_client():
        return db.query(Client).filter(Client.cli_id == client_id).first()
    
    client = await asyncio.to_thread(_fetch_client)
    if not client:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Client not found")
    return client_to_response(client)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
