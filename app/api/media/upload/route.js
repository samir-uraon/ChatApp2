import { NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs/promises";
import path from "path";

// Disable Next.js automatic body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    multiples: false,
  });

  // Wrap parse in a promise
  const parseForm = (req) =>
    new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

  try {
    const { files } = await parseForm(req);
    const file = files.file;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filePath = file.filepath || file.path;
    const fileUrl = `/uploads/${path.basename(filePath)}`;

    return NextResponse.json({ url: fileUrl });
  } catch (err) {
    console.error("File upload error:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}