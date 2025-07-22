from fastapi import FastAPI, APIRouter, HTTPException, Response
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
import pandas as pd
from io import BytesIO

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
    role: str = "employee"  # "employee" or "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class EmployeeCreate(BaseModel):
    name: str
    pin: str
    role: str = "employee"

class AdminRegister(BaseModel):
    name: str
    pin: str
    admin_code: str  # Secret code to create admin

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
    subtotal: float  # total before discount
    discount_percent: float = 0  # discount percentage
    discount_amount: float = 0  # discount amount in currency
    total_amount: float  # final amount after discount
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
    discount_percent: float = 0
    notes: Optional[str] = None

class ReceiptDelete(BaseModel):
    employee_id: str
    deletion_reason: str

# Category and Unit Models for Customization
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by_employee_id: str
    created_by_employee_name: str

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    created_by_employee_id: str

class Unit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # pcs, kg, set, pasang, lembar, buah, dll
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by_employee_id: str
    created_by_employee_name: str

class UnitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    created_by_employee_id: str

# Enhanced Service Model with Categories and Units
class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # wash, dry_clean, iron, etc.
    category_id: str
    category_name: str  # denormalized
    unit_id: str
    unit_name: str  # denormalized
    base_price: float
    duration_days: int = 0
    duration_hours: int = 0
    duration_minutes: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by_employee_id: str
    created_by_employee_name: str

class ServiceCreate(BaseModel):
    name: str
    category_id: str
    unit_id: str
    base_price: float
    duration_days: int = 0
    duration_hours: int = 0
    duration_minutes: int = 0
    created_by_employee_id: str

# Package Model for Bundle Services
class Package(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    services: List[dict]  # List of {service_id, quantity, discounted_price}
    total_price: float
    discounted_price: float
    discount_percent: float
    duration_days: int = 0
    duration_hours: int = 0
    duration_minutes: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by_employee_id: str
    created_by_employee_name: str

class PackageCreate(BaseModel):
    name: str
    description: Optional[str] = None
    services: List[dict]  # {service_id: str, quantity: int}
    discount_percent: float
    created_by_employee_id: str

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

# Admin registration endpoint
@api_router.post("/admin/register", response_model=Employee)
async def register_admin(admin_data: AdminRegister):
    # Secret admin code - in production, this should be environment variable
    ADMIN_SECRET_CODE = "LAUNDRY_ADMIN_2025"
    
    if admin_data.admin_code != ADMIN_SECRET_CODE:
        raise HTTPException(status_code=403, detail="Invalid admin code")
    
    # Check if PIN already exists
    existing = await db.employees.find_one({"pin": admin_data.pin})
    if existing:
        raise HTTPException(status_code=400, detail="PIN already exists")
    
    # Create admin employee
    admin = Employee(
        name=admin_data.name,
        pin=admin_data.pin,
        role="admin"
    )
    
    await db.employees.insert_one(admin.dict())
    return admin

# Helper function to check admin role
async def verify_admin(employee_id: str):
    employee = await db.employees.find_one({"id": employee_id, "is_active": True})
    if not employee or employee.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return employee

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

# Delete client endpoint (Admin only)
@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, admin_id: str):
    # Verify admin access
    await verify_admin(admin_id)
    
    # Check if client exists
    client = await db.clients.find_one({"id": client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check if client has any ACTIVE receipts (pending or ready)
    # Completed receipts are considered inactive
    active_receipts = await db.receipts.count_documents({
        "client_id": client_id,
        "is_deleted": {"$ne": True},
        "status": {"$in": ["pending", "ready"]}  # Only pending and ready are considered active
    })
    
    if active_receipts > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete client with {active_receipts} active receipts (pending/ready). Please complete or cancel them first."
        )
    
    # Delete the client (clients with only completed receipts can be deleted)
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return {"message": f"Client {client['name']} deleted successfully"}

# Get clients with receipt count (Admin only)
@api_router.get("/admin/clients-with-stats")
async def get_clients_with_stats(admin_id: str):
    # Verify admin access
    await verify_admin(admin_id)
    
    # Get all clients first
    clients = await db.clients.find().to_list(1000)
    
    # For each client, get receipt statistics
    clients_with_stats = []
    for client in clients:
        client_dict = dict(client)
        
        # Convert ObjectId to string if exists
        if '_id' in client_dict:
            del client_dict['_id']
        
        # Get receipt statistics for this client
        receipts = await db.receipts.find({"client_id": client_dict["id"]}).to_list(1000)
        
        all_receipts = [r for r in receipts if not r.get('is_deleted', False)]
        # Only pending and ready receipts are considered "active"
        active_receipts = [r for r in all_receipts if r.get('status') in ['pending', 'ready']]
        
        client_dict['total_receipts'] = len(receipts)
        client_dict['active_receipts'] = len(active_receipts)  # Only pending/ready
        client_dict['completed_receipts'] = len([r for r in all_receipts if r.get('status') == 'completed'])
        client_dict['total_spent'] = sum(r.get('total_amount', 0) for r in all_receipts)
        client_dict['last_visit'] = max([r.get('created_at') for r in receipts], default=None)
        
        clients_with_stats.append(client_dict)
    
    # Sort by name
    clients_with_stats.sort(key=lambda x: x.get('name', ''))
    
    return clients_with_stats

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
    
    # Calculate amounts
    subtotal = sum(item.total_price for item in receipt_data.items)
    discount_amount = subtotal * (receipt_data.discount_percent / 100)
    total_amount = subtotal - discount_amount
    
    receipt_dict = receipt_data.dict()
    receipt_dict.update({
        "client_name": client["name"],
        "client_phone": client["phone"],
        "employee_name": employee["name"],
        "subtotal": subtotal,
        "discount_amount": discount_amount,
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
        "subtotal": receipt.get("subtotal", receipt["total_amount"]),
        "discount_percent": receipt.get("discount_percent", 0),
        "discount_amount": receipt.get("discount_amount", 0),
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

# Excel Export endpoint
@api_router.get("/reports/excel-export")
async def export_receipts_to_excel(start_date: str, end_date: str, include_deleted: bool = False):
    """
    Export receipts to Excel format
    start_date and end_date should be in YYYY-MM-DD format
    """
    try:
        # Parse dates
        start_dt = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, tzinfo=timezone.utc)
        end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Build query
    query = {
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }
    
    if not include_deleted:
        query["is_deleted"] = {"$ne": True}
    
    # Get receipts from database
    receipts = await db.receipts.find(query).sort("created_at", 1).to_list(10000)
    
    if not receipts:
        raise HTTPException(status_code=404, detail="No receipts found for the specified date range")
    
    # Prepare data for Excel
    excel_data = []
    for receipt in receipts:
        # Get status in Indonesian
        status_map = {
            'pending': 'Menunggu',
            'ready': 'Siap',
            'completed': 'Selesai',
            'deleted': 'Dihapus'
        }
        
        # Format items for display
        items_text = "; ".join([
            f"{item['quantity']}x {item['item_type']} ({item['service']})"
            for item in receipt.get('items', [])
        ])
        
        excel_data.append({
            'No.': len(excel_data) + 1,
            'ID Transaksi': receipt['id'][-8:].upper(),
            'Tanggal': receipt['created_at'].strftime('%d/%m/%Y %H:%M'),
            'Nama Pelanggan': receipt['client_name'],
            'Telepon': receipt['client_phone'],
            'Item Laundry': items_text,
            'Karyawan': receipt['employee_name'],
            'Subtotal (Rp)': receipt.get('subtotal', receipt.get('total_amount', 0)),
            'Diskon (%)': receipt.get('discount_percent', 0),
            'Jumlah Diskon (Rp)': receipt.get('discount_amount', 0),
            'Total Bayar (Rp)': receipt['total_amount'],
            'Status': status_map.get(receipt['status'], receipt['status']),
            'Catatan': receipt.get('notes', ''),
            'Dihapus': 'Ya' if receipt.get('is_deleted', False) else 'Tidak',
            'Alasan Hapus': receipt.get('deletion_reason', '') if receipt.get('is_deleted', False) else ''
        })
    
    # Create DataFrame
    df = pd.DataFrame(excel_data)
    
    # Create Excel file in memory
    excel_buffer = BytesIO()
    
    # Create Excel writer with formatting
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        # Write main data
        df.to_excel(writer, sheet_name='Laporan Transaksi', index=False)
        
        # Get workbook and worksheet for formatting
        workbook = writer.book
        worksheet = writer.sheets['Laporan Transaksi']
        
        # Format headers - fix: use Font from openpyxl.styles
        from openpyxl.styles import Font
        header_font = Font(bold=True)
        for cell in worksheet[1]:
            cell.font = header_font
        
        # Auto-adjust column widths
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
        
        # Add summary sheet
        summary_data = []
        total_receipts = len([r for r in receipts if not r.get('is_deleted', False)])
        total_deleted = len([r for r in receipts if r.get('is_deleted', False)])
        total_amount = sum([r['total_amount'] for r in receipts if not r.get('is_deleted', False)])
        total_discount = sum([r.get('discount_amount', 0) for r in receipts if not r.get('is_deleted', False)])
        
        summary_data.append(['RINGKASAN LAPORAN', ''])
        summary_data.append(['Periode', f"{start_date} s/d {end_date}"])
        summary_data.append(['Total Transaksi', total_receipts])
        summary_data.append(['Transaksi Dihapus', total_deleted])
        summary_data.append(['Total Pendapatan', f"Rp {total_amount:,.0f}"])
        summary_data.append(['Total Diskon', f"Rp {total_discount:,.0f}"])
        summary_data.append(['', ''])
        
        # Employee summary
        employee_summary = {}
        for receipt in receipts:
            if receipt.get('is_deleted', False):
                continue
            emp_name = receipt['employee_name']
            if emp_name not in employee_summary:
                employee_summary[emp_name] = {'count': 0, 'total': 0}
            employee_summary[emp_name]['count'] += 1
            employee_summary[emp_name]['total'] += receipt['total_amount']
        
        summary_data.append(['RINGKASAN PER KARYAWAN', ''])
        for emp_name, data in employee_summary.items():
            summary_data.append([emp_name, f"{data['count']} transaksi - Rp {data['total']:,.0f}"])
        
        # Write summary to separate sheet
        summary_df = pd.DataFrame(summary_data, columns=['Item', 'Nilai'])
        summary_df.to_excel(writer, sheet_name='Ringkasan', index=False)
        
        # Format summary sheet
        summary_ws = writer.sheets['Ringkasan']
        for cell in summary_ws[1]:
            cell.font = header_font
        
        # Auto-adjust summary column widths
        for column in summary_ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            summary_ws.column_dimensions[column_letter].width = adjusted_width
    
    excel_buffer.seek(0)
    
    # Generate filename
    filename = f"Laporan_Laundry_{start_date}_to_{end_date}.xlsx"
    
    return Response(
        content=excel_buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# ============================================
# NEW CUSTOMIZATION ENDPOINTS
# ============================================

# Categories endpoints
@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate):
    # Get employee details for audit trail
    employee = await db.employees.find_one({"id": category_data.created_by_employee_id, "is_active": True})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if category name already exists
    existing = await db.categories.find_one({"name": category_data.name.lower(), "is_active": True})
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    category = Category(
        **category_data.dict(),
        created_by_employee_name=employee["name"]
    )
    await db.categories.insert_one(category.dict())
    return category

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({"is_active": True}).to_list(100)
    return [Category(**cat) for cat in categories]

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, category_data: CategoryCreate):
    result = await db.categories.update_one(
        {"id": category_id, "is_active": True},
        {"$set": {
            "name": category_data.name,
            "description": category_data.description,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category updated successfully"}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deactivated successfully"}

# Units endpoints
@api_router.post("/units", response_model=Unit)
async def create_unit(unit_data: UnitCreate):
    # Get employee details for audit trail
    employee = await db.employees.find_one({"id": unit_data.created_by_employee_id, "is_active": True})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if unit name already exists
    existing = await db.units.find_one({"name": unit_data.name.lower(), "is_active": True})
    if existing:
        raise HTTPException(status_code=400, detail="Unit name already exists")
    
    unit = Unit(
        **unit_data.dict(),
        created_by_employee_name=employee["name"]
    )
    await db.units.insert_one(unit.dict())
    return unit

@api_router.get("/units", response_model=List[Unit])
async def get_units():
    units = await db.units.find({"is_active": True}).to_list(100)
    return [Unit(**unit) for unit in units]

@api_router.put("/units/{unit_id}")
async def update_unit(unit_id: str, unit_data: UnitCreate):
    result = await db.units.update_one(
        {"id": unit_id, "is_active": True},
        {"$set": {
            "name": unit_data.name,
            "description": unit_data.description,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {"message": "Unit updated successfully"}

@api_router.delete("/units/{unit_id}")
async def delete_unit(unit_id: str):
    result = await db.units.update_one(
        {"id": unit_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {"message": "Unit deactivated successfully"}

# Enhanced Services endpoints
@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate):
    # Get employee details
    employee = await db.employees.find_one({"id": service_data.created_by_employee_id, "is_active": True})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get category and unit details
    category = await db.categories.find_one({"id": service_data.category_id, "is_active": True})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    unit = await db.units.find_one({"id": service_data.unit_id, "is_active": True})
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    service = Service(
        **service_data.dict(),
        category_name=category["name"],
        unit_name=unit["name"],
        created_by_employee_name=employee["name"]
    )
    await db.services.insert_one(service.dict())
    return service

@api_router.get("/services", response_model=List[Service])
async def get_services():
    services = await db.services.find({"is_active": True}).to_list(100)
    return [Service(**svc) for svc in services]

# Packages endpoints
@api_router.post("/packages", response_model=Package)
async def create_package(package_data: PackageCreate):
    # Get employee details
    employee = await db.employees.find_one({"id": package_data.created_by_employee_id, "is_active": True})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Calculate package pricing and duration
    total_price = 0
    max_duration_minutes = 0  # Total duration in minutes for easier comparison
    
    for service_item in package_data.services:
        service = await db.services.find_one({"id": service_item["service_id"], "is_active": True})
        if not service:
            raise HTTPException(status_code=404, detail=f"Service {service_item['service_id']} not found")
        
        quantity = service_item["quantity"]
        total_price += service["base_price"] * quantity
        
        # Convert service duration to total minutes for comparison
        service_minutes = (service.get("duration_days", 0) * 24 * 60) + (service.get("duration_hours", 0) * 60) + service.get("duration_minutes", 0)
        if service_minutes > max_duration_minutes:
            max_duration_minutes = service_minutes
    
    # Convert back to days, hours, minutes
    duration_days = max_duration_minutes // (24 * 60)
    remaining_minutes = max_duration_minutes % (24 * 60)
    duration_hours = remaining_minutes // 60
    duration_minutes = remaining_minutes % 60
    
    discounted_price = total_price * (1 - package_data.discount_percent / 100)
    
    package = Package(
        **package_data.dict(),
        total_price=total_price,
        discounted_price=discounted_price,
        duration_days=duration_days,
        created_by_employee_name=employee["name"]
    )
    await db.packages.insert_one(package.dict())
    return package

@api_router.get("/packages", response_model=List[Package])
async def get_packages():
    packages = await db.packages.find({"is_active": True}).to_list(100)
    return [Package(**pkg) for pkg in packages]

# Initialization endpoint
@api_router.post("/initialize")
async def initialize_default_data():
    """Initialize default categories, units, and services for new installation"""
    
    # Create system admin employee if not exists
    admin_employee = await db.employees.find_one({"role": "admin", "is_active": True})
    if not admin_employee:
        admin_employee = Employee(
            name="System Admin",
            pin="0000",
            role="admin"
        )
        await db.employees.insert_one(admin_employee.dict())
    
    admin_id = admin_employee["id"] if isinstance(admin_employee, dict) else admin_employee.id
    admin_name = admin_employee["name"] if isinstance(admin_employee, dict) else admin_employee.name
    
    # Default Categories
    default_categories = [
        {"name": "Pakaian", "description": "Baju, celana, dan pakaian umum"},
        {"name": "Sepatu", "description": "Sepatu dan alas kaki"},
        {"name": "Tas", "description": "Tas, dompet, dan aksesoris"},
        {"name": "Selimut", "description": "Selimut, sprei, dan perlengkapan tidur"},
        {"name": "Karpet", "description": "Karpet dan permadani"},
        {"name": "Boneka", "description": "Boneka dan mainan kain"},
    ]
    
    created_categories = []
    for cat_data in default_categories:
        existing = await db.categories.find_one({"name": cat_data["name"], "is_active": True})
        if not existing:
            category = Category(
                name=cat_data["name"],
                description=cat_data["description"],
                created_by_employee_id=admin_id,
                created_by_employee_name=admin_name
            )
            await db.categories.insert_one(category.dict())
            created_categories.append(category.name)
    
    # Default Units
    default_units = [
        {"name": "pcs", "description": "Pieces - untuk menghitung per potong"},
        {"name": "kg", "description": "Kilogram - untuk menghitung per berat"},
        {"name": "set", "description": "Set - untuk menghitung per set/pasang"},
        {"name": "pasang", "description": "Pasang - untuk sepatu, sandal"},
        {"name": "lembar", "description": "Lembar - untuk sprei, selimut"},
        {"name": "buah", "description": "Buah - untuk tas, koper"},
    ]
    
    created_units = []
    for unit_data in default_units:
        existing = await db.units.find_one({"name": unit_data["name"], "is_active": True})
        if not existing:
            unit = Unit(
                name=unit_data["name"],
                description=unit_data["description"],
                created_by_employee_id=admin_id,
                created_by_employee_name=admin_name
            )
            await db.units.insert_one(unit.dict())
            created_units.append(unit.name)
    
    # Get created categories and units for creating default services
    categories = await db.categories.find({"is_active": True}).to_list(100)
    units = await db.units.find({"is_active": True}).to_list(100)
    
    # Create mapping for easy lookup
    category_map = {cat["name"]: cat for cat in categories}
    unit_map = {unit["name"]: unit for unit in units}
    
    # Default Services
    default_services = [
        {"name": "Cuci Setrika", "category": "Pakaian", "unit": "kg", "price": 8000, "duration": 2},
        {"name": "Cuci Kering", "category": "Pakaian", "unit": "kg", "price": 6000, "duration": 1},
        {"name": "Setrika Saja", "category": "Pakaian", "unit": "kg", "price": 4000, "duration": 1},
        {"name": "Dry Clean", "category": "Pakaian", "unit": "pcs", "price": 15000, "duration": 3},
        {"name": "Cuci Sepatu", "category": "Sepatu", "unit": "pasang", "price": 25000, "duration": 2},
        {"name": "Deep Clean Sepatu", "category": "Sepatu", "unit": "pasang", "price": 35000, "duration": 3},
        {"name": "Cuci Tas", "category": "Tas", "unit": "buah", "price": 20000, "duration": 2},
        {"name": "Cuci Selimut", "category": "Selimut", "unit": "lembar", "price": 15000, "duration": 2},
        {"name": "Cuci Karpet", "category": "Karpet", "unit": "lembar", "price": 30000, "duration": 3},
    ]
    
    created_services = []
    for svc_data in default_services:
        existing = await db.services.find_one({"name": svc_data["name"], "is_active": True})
        if not existing:
            category = category_map.get(svc_data["category"])
            unit = unit_map.get(svc_data["unit"])
            
            if category and unit:
                service = Service(
                    name=svc_data["name"],
                    category_id=category["id"],
                    category_name=category["name"],
                    unit_id=unit["id"],
                    unit_name=unit["name"],
                    base_price=svc_data["price"],
                    duration_days=svc_data["duration"],
                    created_by_employee_id=admin_id,
                    created_by_employee_name=admin_name
                )
                await db.services.insert_one(service.dict())
                created_services.append(service.name)
    
    return {
        "message": "Default data initialized successfully",
        "created_categories": created_categories,
        "created_units": created_units,
        "created_services": created_services
    }

# ============================================

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