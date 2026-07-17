"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export async function createProperty(formData: FormData) {
  await verifySession();

  await prisma.property.create({
    data: {
      standNo: String(formData.get("standNo") || "Unnamed stand"),
      suburb: String(formData.get("suburb") || "—"),
      city: String(formData.get("city") || "Harare"),
      titleDeedNo: String(formData.get("titleDeedNo") || "Pending"),
      surveyDiagram: String(formData.get("surveyDiagram") || "Pending"),
      size: String(formData.get("size") || "—"),
      valuationCents: Math.round(Number(formData.get("valuation") || 0) * 100),
      gps: String(formData.get("gps") || "—"),
      owners: { create: { ownerName: String(formData.get("owner") || "Unknown"), fromYear: new Date().getFullYear() } },
    },
  });

  revalidatePath("/properties");
  redirect("/properties");
}
