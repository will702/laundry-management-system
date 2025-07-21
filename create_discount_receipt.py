#!/usr/bin/env python3
import requests
import json

BASE_URL = 'https://18fec97e-b777-4f87-9069-2647de4ef3de.preview.emergentagent.com/api'

# Get existing clients and employees
clients_resp = requests.get(f'{BASE_URL}/clients')
employees_resp = requests.get(f'{BASE_URL}/employees')

if clients_resp.status_code == 200 and employees_resp.status_code == 200:
    clients = clients_resp.json()
    employees = employees_resp.json()
    
    if clients and employees:
        # Create a receipt with discount
        receipt_data = {
            'client_id': clients[0]['id'],
            'employee_id': employees[0]['id'],
            'items': [
                {'service': 'wash', 'item_type': 'shirt', 'quantity': 2, 'price_per_item': 10.00, 'total_price': 20.00}
            ],
            'discount_percent': 15.0,
            'notes': 'Receipt with 15% discount for testing print functionality'
        }
        
        response = requests.post(f'{BASE_URL}/receipts', json=receipt_data)
        if response.status_code == 200:
            receipt = response.json()
            print(f'Created receipt with discount: {receipt["id"]}')
            print(f'Subtotal: ${receipt["subtotal"]:.2f}')
            print(f'Discount: {receipt["discount_percent"]}% (${receipt["discount_amount"]:.2f})')
            print(f'Total: ${receipt["total_amount"]:.2f}')
        else:
            print(f'Failed to create receipt: {response.status_code}')
    else:
        print('No clients or employees found')
else:
    print('Failed to get clients or employees')