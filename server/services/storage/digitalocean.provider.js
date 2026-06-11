/**
 * DigitalOcean Spaces storage provider.
 *
 * DO Spaces is S3-compatible, so we use the AWS SDK v3.
 *
 * Required env vars:
 *   STORAGE_PROVIDER=digitalocean
 *   DO_SPACES_KEY        — Spaces access key ID
 *   DO_SPACES_SECRET     — Spaces secret access key
 *   DO_SPACES_REGION     — e.g. "nyc3", "sgp1", "fra1"
 *   DO_SPACES_BUCKET     — your Space name
 *   DO_SPACES_CDN_URL    — (optional) CDN endpoint, e.g. "https://cdn.wiibienergy.com"
 */

import sharp from "sharp";
import path from "path";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const createClient = () => {
  const region = process.env.DO_SPACES_REGION;
  if (!region) throw new Error("DO_SPACES_REGION is not set");

  return new S3Client({
    endpoint:    `https://${region}.digitaloceanspaces.com`,
    region,
    credentials: {
      accessKeyId:     process.env.DO_SPACES_KEY    || "",
      secretAccessKey: process.env.DO_SPACES_SECRET || "",
    },
    forcePathStyle: false,
  });
};

const getPublicUrl = (key) => {
  const cdn    = process.env.DO_SPACES_CDN_URL;
  const bucket = process.env.DO_SPACES_BUCKET;
  const region = process.env.DO_SPACES_REGION;
  return cdn
    ? `${cdn}/${key}`
    : `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
};

export const digitalOceanProvider = {
  name: "digitalocean",

  async saveFile(buffer, { entityType, fieldname = "image", originalname = "image.jpg" }) {
    const bucket = process.env.DO_SPACES_BUCKET;
    if (!bucket) throw new Error("DO_SPACES_BUCKET is not set");

    const suffix   = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `optimized-${fieldname}-${suffix}.jpg`;
    const key      = `uploads/${entityType}/${filename}`;

    const { data: optimizedBuffer, info } = await sharp(buffer)
      .rotate()
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    const upload = new Upload({
      client: createClient(),
      params: {
        Bucket:      bucket,
        Key:         key,
        Body:        optimizedBuffer,
        ContentType: "image/jpeg",
        ACL:         "public-read",
      },
    });

    await upload.done();

    return {
      url:         getPublicUrl(key),
      filename,
      width:       info.width,
      height:      info.height,
      storagePath: key,
    };
  },

  async deleteFile(storagePath) {
    if (!storagePath) return;
    try {
      await createClient().send(new DeleteObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key:    storagePath,
      }));
    } catch {}
  },
};
