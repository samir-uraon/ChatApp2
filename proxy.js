import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET;

export function proxy(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/resister", req.url));
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    const response = NextResponse.next();
    return response;
  } catch (err) {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/", "/profile/:path*"],
};