from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class Employee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    pin: str
    role: str = "employee"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class EmployeeCreate(BaseModel):
    name: str
    pin: str
    role: str = "employee"

class EmployeeLogin(BaseModel):
    pin: str

class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientCreate(BaseModel):
    name: str
    phone: str

class ReceiptItem(BaseModel):
    service: str  # wash, dry_clean, iron, etc.
    item_type: str  # shirt, pants, dress, etc.
    quantity: int
    price_per_item: float
    total_price: float

class Receipt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str  # denormalized for easy display
    client_phone: str  # denormalized for easy display
    employee_id: str
    employee_name: str  # denormalized for audit trail
    items: List[ReceiptItem]
    total_amount: float
    status: str = "pending"  # pending, ready, completed, deleted
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_employee_id: Optional[str] = None
    deleted_by_employee_name: Optional[str] = None
    deletion_reason: Optional[str] = None

class ReceiptCreate(BaseModel):
    client_id: str
    employee_id: str
    items: List[ReceiptItem]
    notes: Optional[str] = None

class ReceiptDelete(BaseModel):
    employee_id: str
    deletion_reason: str

# Employee endpoints
@api_router.post("/employees", response_model=Employee)
async def create_employee(employee_data: EmployeeCreate):
    # Check if PIN already exists
    existing = await db.employees.find_one({"pin": employee_data.pin})
    if existing:
        raise HTTPException(status_code=400, detail="PIN already exists")
    
    employee = Employee(**employee_data.dict())
    await db.employees.insert_one(employee.dict())
    return employee

@api_router.get("/employees", response_model=List[Employee])
async def get_employees():
    employees = await db.employees.find({"is_active": True}).to_list(100)
    return [Employee(**emp) for emp in employees]

@api_router.post("/employees/login")
async def employee_login(login_data: EmployeeLogin):
    employee = await db.employees.find_one({"pin": login_data.pin, "is_active": True})
    if not employee:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    return Employee(**employee)

# Client endpoints
@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate):
    client = Client(**client_data.dict())
    await db.clients.insert_one(client.dict())
    return client

@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find().sort("name", 1).to_list(1000)
    return [Client(**client) for client in clients]

@api_router.get("/clients/search")
async def search_clients(q: str):
    # Search by name or phone
    regex_pattern = {"$regex": q, "$options": "i"}
    clients = await db.clients.find({
        "$or": [
            {"name": regex_pattern},
            {"phone": regex_pattern}
        ]
    }).limit(10).to_list(10)
    return [Client(**client) for client in clients]

# Receipt endpoints
@api_router.post("/receipts", response_model=Receipt)
async def create_receipt(receipt_data: ReceiptCreate):
    # Get client and employee info for denormalization
    client = await db.clients.find_one({"id": receipt_data.client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    employee = await db.employees.find_one({"id": receipt_data.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Calculate total amount
    total_amount = sum(item.total_price for item in receipt_data.items)
    
    receipt_dict = receipt_data.dict()
    receipt_dict.update({
        "client_name": client["name"],
        "client_phone": client["phone"],
        "employee_name": employee["name"],
        "total_amount": total_amount
    })
    
    receipt = Receipt(**receipt_dict)
    await db.receipts.insert_one(receipt.dict())
    return receipt

@api_router.get("/receipts", response_model=List[Receipt])
async def get_receipts(limit: int = 50, employee_id: Optional[str] = None, include_deleted: bool = False):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    
    if not include_deleted:
        query["is_deleted"] = {"$ne": True}
    
    receipts = await db.receipts.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [Receipt(**receipt) for receipt in receipts]

@api_router.get("/receipts/{receipt_id}", response_model=Receipt)
async def get_receipt(receipt_id: str):
    receipt = await db.receipts.find_one({"id": receipt_id})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return Receipt(**receipt)

@api_router.put("/receipts/{receipt_id}/status")
async def update_receipt_status(receipt_id: str, status: str, employee_id: str):
    # Verify employee exists
    employee = await db.employees.find_one({"id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if receipt exists and is not deleted
    receipt = await db.receipts.find_one({"id": receipt_id, "is_deleted": {"$ne": True}})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found or has been deleted")
    
    result = await db.receipts.update_one(
        {"id": receipt_id},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    return {"message": "Status updated successfully"}

@api_router.delete("/receipts/{receipt_id}")
async def delete_receipt(receipt_id: str, delete_data: ReceiptDelete):
    # Verify employee exists
    employee = await db.employees.find_one({"id": delete_data.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if receipt exists and is not already deleted
    receipt = await db.receipts.find_one({"id": receipt_id, "is_deleted": {"$ne": True}})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found or already deleted")
    
    # Soft delete - mark as deleted but keep for audit trail
    result = await db.receipts.update_one(
        {"id": receipt_id},
        {
            "$set": {
                "is_deleted": True,
                "deleted_at": datetime.now(timezone.utc),
                "deleted_by_employee_id": delete_data.employee_id,
                "deleted_by_employee_name": employee["name"],
                "deletion_reason": delete_data.deletion_reason,
                "status": "deleted",
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    return {
        "message": "Receipt deleted successfully", 
        "deleted_by": employee["name"],
        "deletion_reason": delete_data.deletion_reason
    }

# Audit endpoints
@api_router.get("/audit/receipts-by-employee")
async def get_receipts_by_employee(start_date: Optional[str] = None, end_date: Optional[str] = None):
    pipeline = []
    
    # Add date filter if provided
    if start_date and end_date:
        pipeline.append({
            "$match": {
                "created_at": {
                    "$gte": datetime.fromisoformat(start_date.replace('Z', '+00:00')),
                    "$lte": datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                }
            }
        })
    
    pipeline.extend([
        {
            "$group": {
                "_id": "$employee_id",
                "employee_name": {"$first": "$employee_name"},
                "total_receipts": {"$sum": 1},
                "total_amount": {"$sum": "$total_amount"},
                "receipts": {
                    "$push": {
                        "id": "$id",
                        "client_name": "$client_name",
                        "total_amount": "$total_amount",
                        "created_at": "$created_at",
                        "status": "$status"
                    }
                }
            }
        },
        {"$sort": {"total_receipts": -1}}
    ])
    
    result = await db.receipts.aggregate(pipeline).to_list(100)
    return result

@api_router.get("/audit/daily-summary")
async def get_daily_summary():
    # Get last 7 days summary
    pipeline = [
        {
            "$match": {
                "created_at": {
                    "$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0) - 
                           timedelta(days=7)
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "date": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_at"
                        }
                    }
                },
                "total_receipts": {"$sum": 1},
                "total_amount": {"$sum": "$total_amount"}
            }
        },
        {"$sort": {"_id.date": -1}}
    ]
    
    result = await db.receipts.aggregate(pipeline).to_list(100)
    return result

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()