import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  // Use aggregateRaw to bypass stale client schema validation for the new appPassword field
  const profiles = await (prisma.user as unknown as { aggregateRaw: (args: Record<string, unknown>) => Promise<unknown[]> }).aggregateRaw({
    pipeline: [
      { $match: { _id: { $oid: user.id } } },
      { 
        $project: { 
          id: { $toString: "$_id" },
          name: 1, 
          email: 1, 
          currency: 1, 
          monthlyBudget: 1, 
          image: 1, 
          appPassword: 1 
        } 
      }
    ]
  }) as Record<string, unknown>[];
  
  const profile = profiles[0] || null;
  return ok({ profile });
}

export async function PUT(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  // Use runCommandRaw to bypass stale client schema validation for the update
  await prisma.$runCommandRaw({
    update: "User",
    updates: [
      {
        q: { _id: { $oid: user.id } },
        u: {
          $set: {
            name: parsed.data.name,
            currency: parsed.data.currency,
            monthlyBudget: parsed.data.monthlyBudget ?? null,
            appPassword: parsed.data.appPassword || null,
          }
        }
      }
    ]
  });

  // Fetch updated profile using aggregateRaw
  const profiles = await (prisma.user as unknown as { aggregateRaw: (args: Record<string, unknown>) => Promise<unknown[]> }).aggregateRaw({
    pipeline: [
      { $match: { _id: { $oid: user.id } } },
      { 
        $project: { 
          id: { $toString: "$_id" },
          name: 1, 
          email: 1, 
          currency: 1, 
          monthlyBudget: 1, 
          appPassword: 1 
        } 
      }
    ]
  }) as Record<string, unknown>[];
  
  const profile = profiles[0] || null;
  return ok({ profile });
}
