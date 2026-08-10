import sharp from "sharp";
import { DetectionError } from "./errors";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 25_000_000;
export const MAX_IMAGE_EDGE = 1600;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function signatureMatches(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png")
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === "image/webp") {
    return (
      Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
      Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export async function normalizeImage(file: File) {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    throw new DetectionError("unsupported_image", "Upload a JPEG, PNG, or WebP image.", 415);
  }
  if (file.size === 0) throw new DetectionError("invalid_image", "The image is empty.", 422);
  if (file.size > MAX_IMAGE_BYTES) {
    throw new DetectionError("invalid_image_size", "The image must be smaller than 5 MB.", 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!signatureMatches(bytes, file.type)) {
    throw new DetectionError(
      "invalid_image",
      "The file signature does not match its image type.",
      422
    );
  }

  try {
    const pipeline = sharp(bytes, { failOn: "warning", limitInputPixels: MAX_IMAGE_PIXELS });
    const metadata = await pipeline.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS
    ) {
      throw new DetectionError(
        "image_dimensions_exceeded",
        "The image dimensions are too large.",
        413
      );
    }
    const output = await pipeline
      .rotate()
      .resize({
        width: MAX_IMAGE_EDGE,
        height: MAX_IMAGE_EDGE,
        fit: "inside",
        withoutEnlargement: true
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    return { bytes: new Uint8Array(output), mimeType: "image/jpeg" as const };
  } catch (error) {
    if (error instanceof DetectionError) throw error;
    throw new DetectionError("unreadable_image", "The image could not be decoded.", 422);
  }
}
