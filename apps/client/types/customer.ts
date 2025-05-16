/**
 * Customer data type definition
 */
export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer update input type
 */
export type CustomerUpdateInput = Partial<Pick<CustomerData, 'name' | 'phone'>>;
