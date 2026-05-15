import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
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
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas maksimal 10MB" },
        { status: 400 }
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF" },
        { status: 400 }
      );
    }

    const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) {
      return NextResponse.json({ error: "Visitor tidak ditemukan" }, { status: 404 });
    }

    // Upload ke Vercel Blob
    const ext = file.name.split(".").pop();
    const storedName = `${uuidv4()}.${ext}`;
    const blob = await put(`uploads/${visitorId}/${storedName}`, file, {
      access: "public",
    });

    // Simpan ke DB dengan URL blob
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        visitorId,
        originalName: file.name,
        storedName,
        filePath: blob.url,
        fileType: ext?.toUpperCase() || "FILE",
        fileSize: file.size,
        mimeType: file.type,
      },
    });

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