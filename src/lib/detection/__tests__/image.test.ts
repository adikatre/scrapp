import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { DetectionError } from "../errors";
import { MAX_IMAGE_EDGE, normalizeImage } from "../image";

function upload(bytes: Uint8Array, name: string, type: string) {
  return {
    name,
    type,
    size: bytes.byteLength,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  } as File;
}

describe("normalizeImage", () => {
  it("decodes, strips metadata, and constrains dimensions", async () => {
    const input = await sharp({
      create: { width: 2200, height: 1200, channels: 3, background: "#00aa88" }
    })
      .jpeg()
      .withMetadata({ orientation: 1 })
      .toBuffer();
    const output = await normalizeImage(upload(input, "photo.jpg", "image/jpeg"));
    const metadata = await sharp(output.bytes).metadata();
    expect(output.mimeType).toBe("image/jpeg");
    expect(Math.max(metadata.width ?? 0, metadata.height ?? 0)).toBe(MAX_IMAGE_EDGE);
    expect(metadata.exif).toBeUndefined();
  });

  it("rejects a mismatched signature", async () => {
    const input = new TextEncoder().encode("not an image");
    await expect(normalizeImage(upload(input, "photo.jpg", "image/jpeg"))).rejects.toMatchObject({
      code: "invalid_image",
      status: 422
    } satisfies Partial<DetectionError>);
  });

  it("rejects unsupported media", async () => {
    const input = new TextEncoder().encode("gif");
    await expect(normalizeImage(upload(input, "photo.gif", "image/gif"))).rejects.toMatchObject({
      code: "unsupported_image",
      status: 415
    } satisfies Partial<DetectionError>);
  });
});
