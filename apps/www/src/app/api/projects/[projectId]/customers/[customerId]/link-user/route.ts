import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {db} from "@/lib/db";
import { withAuthorization } from "@/lib/middleware/withAuthorization";
import { RESOURCE_TYPES, ACTION_TYPES } from "@/lib/casbin/enforcer";

// Schema for linking a Supabase user to a customer
const linkUserSchema = z.object({
  supabaseUserId: z.string().min(1, "Supabase User ID is required"),
});

/**
 * PATCH /api/projects/[projectId]/customers/[customerId]/link-user
 * Link a Supabase user to an existing customer
 */
export const PATCH = withAuthorization(
  async (
    req: NextRequest,
    { params }: { params: { projectId: string; customerId: string } }
  ) => {
    try {
      const {projectId, customerId} = await params; 
      // Parse and validate request body
      const body = await req.json();
      const validationResult = linkUserSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json({
          error: "Validation error",
          details: validationResult.error.format()
        }, { status: 400 });
      }
      
      const { supabaseUserId } = validationResult.data;
      
      // Check if customer exists
      const customer = await db.customer.findUnique({
        where: {
          id: customerId,
          projectId
        }
      });
      
      if (!customer) {
        return NextResponse.json({
          error: "Customer not found"
        }, { status: 404 });
      }
      
      // Check if another customer already has this Supabase user ID
      const existingCustomerWithUserId = await db.customer.findFirst({
        where: {
          projectId,
          supabaseUserId,
          id: { not: customerId }
        }
      });
      
      if (existingCustomerWithUserId) {
        return NextResponse.json({
          error: "This Supabase user ID is already linked to another customer"
        }, { status: 409 });
      }
      
      // Update the customer with the Supabase user ID
      const updatedCustomer = await db.customer.update({
        where: {
          id: customerId
        },
        data: {
          supabaseUserId
        }
      });
      
      return NextResponse.json(updatedCustomer);
    } catch (error) {
      console.error("Error linking user to customer:", error);
      return NextResponse.json({ error: "Failed to link user to customer" }, { status: 500 });
    }
  },
  RESOURCE_TYPES.CUSTOMER,
  ACTION_TYPES.UPDATE
);
