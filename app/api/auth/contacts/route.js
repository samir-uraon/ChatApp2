import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const cookieStore = await cookies(); // ✅ await needed
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("chatapp");

    const users = await db
      .collection("users")
      .find({ _id: { $ne: new ObjectId(decoded.userId) } })
      .project({ password: 0 })
      .toArray();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Users API Error:", error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}