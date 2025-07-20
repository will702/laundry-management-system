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

class LaundrySettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_name: str = "LaundryPro"
    business_address: str = "Jl. Bersih No. 123, Kota Laundry"
    business_phone: str = "(021) LAUNDRY"
    business_email: str = "info@laundrypro.com"
    logo_url: Optional[str] = None
    footer_notes: str = "Terima kasih atas kepercayaan Anda • Jam operasional: 07:00-21:00 • Komplain maks 1x24 jam"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LaundrySettingsUpdate(BaseModel):
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    business_email: Optional[str] = None
    logo_url: Optional[str] = None
    footer_notes: Optional[str] = None

class ServiceItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # wash, dry_clean, iron, special
    price: float
    unit: str = "pcs"  # pcs, kg, set
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceItemCreate(BaseModel):
    name: str
    category: str
    price: float
    unit: str = "pcs"
    description: Optional[str] = None

class SalesReport(BaseModel):
    date: str
    total_receipts: int
    total_amount: float
    total_items: int
    employees: List[dict]
    services: List[dict]

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
async def get_receipts_by_employee(start_date: Optional[str] = None, end_date: Optional[str] = None, include_deleted: bool = False):
    pipeline = []
    
    # Add date filter if provided
    match_conditions = {}
    if start_date and end_date:
        match_conditions["created_at"] = {
            "$gte": datetime.fromisoformat(start_date.replace('Z', '+00:00')),
            "$lte": datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        }
    
    if not include_deleted:
        match_conditions["is_deleted"] = {"$ne": True}
    
    if match_conditions:
        pipeline.append({"$match": match_conditions})
    
    pipeline.extend([
        {
            "$group": {
                "_id": "$employee_id",
                "employee_name": {"$first": "$employee_name"},
                "total_receipts": {"$sum": 1},
                "total_amount": {"$sum": "$total_amount"},
                "deleted_receipts": {
                    "$sum": {
                        "$cond": [{"$eq": ["$is_deleted", True]}, 1, 0]
                    }
                },
                "receipts": {
                    "$push": {
                        "id": "$id",
                        "client_name": "$client_name",
                        "total_amount": "$total_amount",
                        "created_at": "$created_at",
                        "status": "$status",
                        "is_deleted": {"$ifNull": ["$is_deleted", False]},
                        "deleted_at": "$deleted_at",
                        "deletion_reason": "$deletion_reason"
                    }
                }
            }
        },
        {"$sort": {"total_receipts": -1}}
    ])
    
    result = await db.receipts.aggregate(pipeline).to_list(100)
    return result

@api_router.get("/audit/deleted-receipts")
async def get_deleted_receipts(limit: int = 50):
    """Get all deleted receipts for audit purposes"""
    receipts = await db.receipts.find(
        {"is_deleted": True}
    ).sort("deleted_at", -1).limit(limit).to_list(limit)
    return [Receipt(**receipt) for receipt in receipts]

@api_router.get("/audit/employee-activity")
async def get_employee_activity(employee_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get detailed activity for a specific employee including deletions"""
    pipeline = []
    
    # Match employee and date range
    match_conditions = {"employee_id": employee_id}
    if start_date and end_date:
        match_conditions["created_at"] = {
            "$gte": datetime.fromisoformat(start_date.replace('Z', '+00:00')),
            "$lte": datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        }
    
    pipeline.extend([
        {"$match": match_conditions},
        {
            "$project": {
                "_id": 0,  # Exclude MongoDB ObjectId
                "id": 1,
                "client_name": 1,
                "total_amount": 1,
                "status": 1,
                "created_at": 1,
                "is_deleted": {"$ifNull": ["$is_deleted", False]},
                "deleted_at": 1,
                "deletion_reason": 1,
                "deleted_by_employee_name": 1,
                "activity_type": {
                    "$cond": [
                        {"$eq": ["$is_deleted", True]}, 
                        "deleted", 
                        "created"
                    ]
                }
            }
        },
        {"$sort": {"created_at": -1}}
    ])
    
    # Also get receipts deleted by this employee
    deleted_by_pipeline = [
        {
            "$match": {
                "deleted_by_employee_id": employee_id,
                "is_deleted": True
            }
        },
        {
            "$project": {
                "_id": 0,  # Exclude MongoDB ObjectId
                "id": 1,
                "client_name": 1,
                "total_amount": 1,
                "status": 1,
                "created_at": 1,
                "deleted_at": 1,
                "deletion_reason": 1,
                "employee_name": 1,  # original creator
                "activity_type": {"$literal": "deleted_others"}
            }
        },
        {"$sort": {"deleted_at": -1}}
    ]
    
    created_receipts = await db.receipts.aggregate(pipeline).to_list(100)
    deleted_receipts = await db.receipts.aggregate(deleted_by_pipeline).to_list(100)
    
    return {
        "employee_id": employee_id,
        "receipts_created": created_receipts,
        "receipts_deleted_by_employee": deleted_receipts,
        "summary": {
            "total_created": len([r for r in created_receipts if r["activity_type"] == "created"]),
            "total_deleted": len([r for r in created_receipts if r["activity_type"] == "deleted"]),
            "total_deleted_others": len(deleted_receipts)
        }
    }

@api_router.get("/audit/daily-summary")
async def get_daily_summary(include_deleted: bool = False):
    # Get last 7 days summary
    pipeline = [
        {
            "$match": {
                "created_at": {
                    "$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0) - 
                           timedelta(days=7)
                }
            }
        }
    ]
    
    if not include_deleted:
        pipeline[0]["$match"]["is_deleted"] = {"$ne": True}
    
    pipeline.extend([
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
                "total_amount": {"$sum": "$total_amount"},
                "deleted_count": {
                    "$sum": {
                        "$cond": [{"$eq": ["$is_deleted", True]}, 1, 0]
                    }
                }
            }
        },
        {"$sort": {"_id.date": -1}}
    ])
    
    result = await db.receipts.aggregate(pipeline).to_list(100)
    return result

@api_router.get("/receipts/{receipt_id}/print")
async def get_print_receipt(receipt_id: str):
    """Get receipt data formatted for printing"""
    receipt = await db.receipts.find_one({"id": receipt_id})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Get business settings
    settings = await db.settings.find_one()
    if not settings:
        settings = LaundrySettings().dict()
    
    # Format receipt for printing with business info from settings
    print_data = {
        "business_name": settings["business_name"],
        "business_address": settings["business_address"], 
        "business_phone": settings["business_phone"],
        "business_email": settings["business_email"],
        "logo_url": settings.get("logo_url"),
        "footer_notes": settings["footer_notes"],
        "receipt_id": receipt["id"],
        "client_name": receipt["client_name"],
        "client_phone": receipt["client_phone"],
        "employee_name": receipt["employee_name"],
        "items": receipt["items"],
        "total_amount": receipt["total_amount"],
        "status": receipt["status"],
        "notes": receipt.get("notes", ""),
        "created_at": receipt["created_at"],
        "print_timestamp": datetime.now(timezone.utc),
        "is_deleted": receipt.get("is_deleted", False)
    }
    
    return print_data

# Laundry Settings endpoints
@api_router.get("/settings", response_model=LaundrySettings)
async def get_laundry_settings():
    settings = await db.settings.find_one()
    if not settings:
        # Create default settings
        default_settings = LaundrySettings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings
    return LaundrySettings(**settings)

@api_router.put("/settings", response_model=LaundrySettings)
async def update_laundry_settings(settings_update: LaundrySettingsUpdate):
    # Get current settings
    current_settings = await db.settings.find_one()
    if not current_settings:
        # Create default settings first
        default_settings = LaundrySettings()
        await db.settings.insert_one(default_settings.dict())
        current_settings = default_settings.dict()
    
    # Update only provided fields
    update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.settings.update_one(
        {"id": current_settings["id"]},
        {"$set": update_data}
    )
    
    updated_settings = await db.settings.find_one({"id": current_settings["id"]})
    return LaundrySettings(**updated_settings)

# Service Items endpoints
@api_router.post("/service-items", response_model=ServiceItem)
async def create_service_item(service_data: ServiceItemCreate):
    service_item = ServiceItem(**service_data.dict())
    await db.service_items.insert_one(service_item.dict())
    return service_item

@api_router.get("/service-items", response_model=List[ServiceItem])
async def get_service_items(category: Optional[str] = None, active_only: bool = True):
    query = {}
    if category:
        query["category"] = category
    if active_only:
        query["is_active"] = True
    
    items = await db.service_items.find(query).sort("category", 1).to_list(1000)
    return [ServiceItem(**item) for item in items]

@api_router.put("/service-items/{item_id}")
async def update_service_item(item_id: str, service_data: ServiceItemCreate):
    result = await db.service_items.update_one(
        {"id": item_id},
        {"$set": service_data.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service item not found")
    return {"message": "Service item updated successfully"}

@api_router.delete("/service-items/{item_id}")
async def delete_service_item(item_id: str):
    result = await db.service_items.update_one(
        {"id": item_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service item not found")
    return {"message": "Service item deactivated successfully"}

# Sales Report endpoints
@api_router.get("/reports/daily-sales")
async def get_daily_sales_report(date: Optional[str] = None):
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Parse date
    try:
        report_date = datetime.fromisoformat(date)
        start_date = report_date.replace(hour=0, minute=0, second=0)
        end_date = report_date.replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get receipts for the date
    receipts = await db.receipts.find({
        "created_at": {"$gte": start_date, "$lte": end_date},
        "is_deleted": {"$ne": True}
    }).to_list(1000)
    
    if not receipts:
        return {
            "date": date,
            "total_receipts": 0,
            "total_amount": 0,
            "total_items": 0,
            "employees": [],
            "services": []
        }
    
    # Calculate totals
    total_receipts = len(receipts)
    total_amount = sum(receipt["total_amount"] for receipt in receipts)
    total_items = sum(len(receipt["items"]) for receipt in receipts)
    
    # Group by employees
    employee_stats = {}
    service_stats = {}
    
    for receipt in receipts:
        # Employee stats
        emp_id = receipt["employee_id"]
        emp_name = receipt["employee_name"]
        if emp_id not in employee_stats:
            employee_stats[emp_id] = {
                "employee_name": emp_name,
                "receipts": 0,
                "total_amount": 0
            }
        employee_stats[emp_id]["receipts"] += 1
        employee_stats[emp_id]["total_amount"] += receipt["total_amount"]
        
        # Service stats
        for item in receipt["items"]:
            service = item["service"]
            if service not in service_stats:
                service_stats[service] = {
                    "service_name": service,
                    "quantity": 0,
                    "total_amount": 0
                }
            service_stats[service]["quantity"] += item["quantity"]
            service_stats[service]["total_amount"] += item["total_price"]
    
    return {
        "date": date,
        "total_receipts": total_receipts,
        "total_amount": total_amount,
        "total_items": total_items,
        "employees": list(employee_stats.values()),
        "services": list(service_stats.values())
    }

@api_router.get("/reports/monthly-sales")
async def get_monthly_sales_report(year: int, month: int):
    # Get start and end of month
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc) - timedelta(seconds=1)
    else:
        end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc) - timedelta(seconds=1)
    
    # Aggregate daily sales
    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date, "$lte": end_date},
                "is_deleted": {"$ne": True}
            }
        },
        {
            "$group": {
                "_id": {
                    "day": {"$dayOfMonth": "$created_at"}
                },
                "receipts": {"$sum": 1},
                "total_amount": {"$sum": "$total_amount"}
            }
        },
        {"$sort": {"_id.day": 1}}
    ]
    
    daily_data = await db.receipts.aggregate(pipeline).to_list(31)
    
    return {
        "year": year,
        "month": month,
        "daily_sales": daily_data
    }

# Digital receipt sharing
@api_router.get("/receipts/{receipt_id}/share")
async def get_shareable_receipt(receipt_id: str):
    receipt = await db.receipts.find_one({"id": receipt_id})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    settings = await db.settings.find_one()
    if not settings:
        settings = LaundrySettings().dict()
    
    # Create shareable URL (this would be the app URL with receipt ID)
    share_url = f"https://laundrypro.app/receipt/{receipt_id}"
    
    return {
        "receipt_id": receipt_id,
        "share_url": share_url,
        "qr_code_url": f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={share_url}",
        "receipt_data": receipt,
        "business_info": settings
    }

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}
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