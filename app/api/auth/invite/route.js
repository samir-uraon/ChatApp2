import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import nodemailer from "nodemailer";


export async function POST(req) {
  try {
    const { email } = await req.json();

    
    

    if (!email || !email.endsWith("@gmail.com")) {
      return NextResponse.json(
        { message: "Only Gmail addresses allowed" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("chatapp");
    const users = db.collection("users");


    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }
    const su=process.env.SMTP_USER
    const sp=process.env.SMTP_SEC
    console.log(su,sp);
 

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user:su,
        pass: sp,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    await transporter.sendMail({
      from: `"ChatApp" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "You're invited to ChatApp",
      html: `
        <h2>You have been invited to join ChatApp 🎉</h2>
        <p>Click below to join:</p>
        <a href="${baseUrl}" target="_blank">${baseUrl}</a>
      `,
    });

    return NextResponse.json(
      { message: "Invite sent successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Invite error:", error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}