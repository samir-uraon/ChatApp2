
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const contactId = searchParams.get("contactId");

    if (!userId || !contactId) {
      return NextResponse.json(
        { error: "userId and contactId are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Fetch all messages between user and contact
    const messages = await db
      .collection("messages")
      .find({
        $or: [
          { from: new ObjectId(userId), to: new ObjectId(contactId) },
          { from: new ObjectId(contactId), to: new ObjectId(userId) },
        ],
      })
      .sort({ createdAt: 1 }) // oldest first
      .toArray();

    return NextResponse.json(messages);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { from, to, message, type, timestamp } = await req.json();

    if (!from || !to || !message) {
      return NextResponse.json(
        { error: "from, to, and message are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("messages").insertOne({
      from: new ObjectId(from),
      to: new ObjectId(to),
      message: message,
      type: type || "text",
      timestamp: timestamp || new Date().toLocaleString(),
      createdAt: new Date(),
    });

    const newMessage = {
      _id: result.insertedId,
      from,
      to,
      message,
      type: type || "text",
      timestamp: timestamp || new Date().toLocaleString(),
      createdAt: new Date(),
    };

    return NextResponse.json(newMessage, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}