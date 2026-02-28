import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { name, email, password } = await req.json();

  const client = await clientPromise;
  const db = client.db("chatapp");

  const existing = await db.collection("users").findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.collection("users").insertOne({
    name,
    email,
    password: hashedPassword,
    createdAt: new Date(),
  });

  return NextResponse.json({ message: "User created" }, { status: 201 });
}