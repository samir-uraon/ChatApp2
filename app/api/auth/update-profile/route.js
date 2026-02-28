import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export async function PUT(req) {
  try {
    /* ===============================
       1️⃣ READ TOKEN FROM HTTP-ONLY COOKIE
    =============================== */

    const cookieStore = await cookies();   // ✅ must await
    const token = cookieStore.get("token")?.value;
				
    if (!token) {
					return NextResponse.json(
						{ message: "Not authenticated" },
						{ status: 401 }
					);
    }
				
    /* ===============================
				2️⃣ VERIFY JWT
    =============================== */
				
    let decoded;
    try {
					decoded = jwt.verify(token, process.env.JWT_SECRET);
 
					
						
    } catch (err) {
				
      return NextResponse.json(
        { message: "Session expired. Please login again." },
        { status: 401 }
      );
    }

    if (!decoded?.userId || !ObjectId.isValid(decoded.userId)) {
      return NextResponse.json(
        { message: "Invalid session" },
        { status: 401 }
      );
    }

    /* ===============================
       3️⃣ VALIDATE BODY
    =============================== */

    const body = await req.json();
    const name = body.name?.trim();
    const email = body.email?.trim();



    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    /* ===============================
       4️⃣ CONNECT DATABASE
    =============================== */

    const client = await clientPromise;
    const db = client.db("chatapp");
    const users = db.collection("users");
 
    const userId = new ObjectId(decoded.userId);

    /* ===============================
       5️⃣ CHECK DUPLICATE EMAIL
    =============================== */

    const duplicate = await users.findOne({
      email,
      _id: { $ne: userId },
    });

			
    if (duplicate) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    /* ===============================
       6️⃣ UPDATE USER
    =============================== */

    const updateResult = await users.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          name,
          email,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );
	
    if (!updateResult) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

 
    return NextResponse.json(updateResult, { status: 200 });

  } catch (error) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}