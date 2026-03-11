import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// Max size for the base64 profile image string (≈ 200KB, covers a ~150x150 JPEG)
const MAX_IMAGE_BYTES = 200 * 1024;

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as unknown as Record<string, unknown>).id as string;
  await dbConnect();
  const user = await User.findById(userId).select("profileImage").lean() as { profileImage?: string | null } | null;
  return NextResponse.json({ profileImage: user?.profileImage ?? null });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as unknown as Record<string, unknown>).id as string;

  const body = await req.json().catch(() => null);
  const { profileImage } = body ?? {};

  if (!profileImage || typeof profileImage !== "string") {
    return NextResponse.json({ error: "Image data is required" }, { status: 400 });
  }

  // Validate it's a base64 data URL for an image
  if (!profileImage.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
  }

  // Check size
  const byteLength = Buffer.byteLength(profileImage, "utf8");
  if (byteLength > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. Please use a smaller photo." },
      { status: 400 }
    );
  }

  await dbConnect();
  await User.updateOne({ _id: userId }, { profileImage });

  return NextResponse.json({ success: true });
}
