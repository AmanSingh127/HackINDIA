import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let extractedText = "";

    if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } 
    else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      fileName.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    }
    else {
      // For unsupported binary types, fallback or error
      return NextResponse.json({ error: "Unsupported file type. Please use PDF, DOCX, or TXT." }, { status: 400 });
    }
    
    return NextResponse.json({ text: extractedText }, { status: 200 });
  } catch (error) {
    console.error("Resume Parsing Error:", error);
    return NextResponse.json({ error: "Failed to parse document" }, { status: 500 });
  }
}
