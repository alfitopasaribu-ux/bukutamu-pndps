import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const visitorId = formData.get("visitorId") as string;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    if (!visitorId) {
      return NextResponse.json({ error: "Visitor ID diperlukan" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas maksimal 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF" },
        { status: 400 }
      );
    }

    // Validate visitor exists
    const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) {
      return NextResponse.json({ error: "Visitor tidak ditemukan" }, { status: 404 });
    }

    // Prepare upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", visitorId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const storedName = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, storedName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Store in DB
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        visitorId,
        originalName: file.name,
        storedName,
        filePath: `/uploads/${visitorId}/${storedName}`,
        fileType: ext.replace(".", "").toUpperCase(),
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    // Log
    await prisma.visitLog.create({
      data: {
        visitorId,
        action: "FILE_UPLOADED",
        details: `File diupload: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: "File berhasil diupload",
      data: uploadedFile,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 });
  }
}