import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ status: "NOT_FOUND" });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { status: true },
    });

    if (!user) return NextResponse.json({ status: "NOT_FOUND" });

    return NextResponse.json({ status: user.status });
  } catch {
    return NextResponse.json({ status: "ERROR" });
  }
}