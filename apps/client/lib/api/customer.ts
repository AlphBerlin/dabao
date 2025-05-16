// Client API service for customer data management
import { CustomerData } from '@/types/customer';

/**
 * Fetch the current authenticated customer's data
 */
export async function getCurrentCustomer(): Promise<CustomerData> {
  const response = await fetch('/api/customer', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch customer data');
  }
  
  return response.json();
}

/**
 * Update the current customer's profile data
 */
export async function updateCustomerProfile(data: Partial<CustomerData>): Promise<CustomerData> {
  const response = await fetch('/api/customer', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update customer profile');
  }
  
  return response.json();
}
