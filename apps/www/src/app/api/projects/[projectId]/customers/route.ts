import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from '@/lib/prisma';
import { withAuthorization } from '@/lib/middleware/withAuthorization';
import { RESOURCE_TYPES, ACTION_TYPES } from '@/lib/casbin/enforcer';

// Schema for customer creation/update
const customerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  // Add other customer fields as needed
});

/**
 * GET /api/projects/[projectId]/customers
 * Get all customers for a specific project
 */
export const GET = withAuthorization(
  async (
    req: NextRequest,
    { params }: { params: { projectId: string } }
  ) => {
    try {
      const projectId = (await params).projectId;
      
      // Get query parameters
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
      const search = url.searchParams.get('search') || '';
      
      // Build query conditions
      const where = {
        projectId,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      };
      
      // Get customers with pagination
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.customer.count({ where })
      ]);
      
      return NextResponse.json({
        data: customers,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
  },
  RESOURCE_TYPES.CUSTOMER,
  ACTION_TYPES.READ
);

/**
 * POST /api/projects/[projectId]/customers
 * Create a new customer for a specific project
 */
export const POST = withAuthorization(
  async (
    req: NextRequest,
    { params }: { params: { projectId: string } }
  ) => {
    try {
      const projectId = (await params).projectId;
      
      // Parse and validate request body
      const body = await req.json();
      const validationResult = customerSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json({
          error: "Validation error",
          details: validationResult.error.format()
        }, { status: 400 });
      }
      
      const { email, name, phone, ...otherData } = validationResult.data;
      
      // Check if customer with this email already exists
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          projectId,
          email: {
            equals: email,
            mode: 'insensitive'
          }
        }
      });
      
      if (existingCustomer) {
        return NextResponse.json({
          error: "Customer with this email already exists"
        }, { status: 409 });
      }
      
      // Create the customer
      const customer = await prisma.customer.create({
        data: {
          projectId,
          email,
          name,
          phone,
          ...otherData
        }
      });
      
      return NextResponse.json(customer, { status: 201 });
    } catch (error) {
      console.error("Error creating customer:", error);
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
  },
  RESOURCE_TYPES.CUSTOMER,
  ACTION_TYPES.CREATE
);