import { NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs/promises";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // handle multipart manually
  },
};

export async function POST(req) {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  // Use formidable's promise-based API
  const form = formidable({ 
    uploadDir,
    keepExtensions: true,
    multiples: false, // set true if you want multiple files
  });

  try {
    const { files } = await form.parse(req); // promise-based parse
    const file = files.file;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // modern formidable uses .filepath
    const filePath = file.filepath || file.path;
    const fileUrl = `/uploads/${path.basename(filePath)}`;

    return NextResponse.json({ url: fileUrl });
  } catch (err) {
    console.error("File upload error:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}