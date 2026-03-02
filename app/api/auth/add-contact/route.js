import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { email } = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = await clientPromise;
    const db = client.db("chatapp");

    const currentUserId = new ObjectId(decoded.userId);

    // find user by email
    const userToAdd = await db.collection("users").findOne({ email });

    if (!userToAdd) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (userToAdd._id.equals(currentUserId)) {
      return NextResponse.json({ message: "Cannot add yourself" }, { status: 400 });
    }

    // add contact if not already added
    await db.collection("users").updateOne(
      { _id: currentUserId },
      { $addToSet: { contacts: userToAdd._id } } // prevents duplicate
    );

    return NextResponse.json({ message: "Contact added successfully" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}