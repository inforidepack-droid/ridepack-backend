import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env, isS3Configured } from "@/config/env.config";
import { createError } from "@/utils/appError";
import { logger } from "@/config/logger";

const getClient = (): S3Client | null => {
  if (!isS3Configured()) return null;
  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

const client = getClient();

/**
 * Uploads a buffer to S3. Returns the public URL of the object.
 * In development without S3 config, returns a placeholder URL.
 */
export const uploadBuffer = async (
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> => {
  if (!client) {
    logger.warn("[S3] Not configured; returning placeholder URL");
    return `https://${env.S3_BUCKET || "bucket"}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // ACL: "public-read",
    })
  );

  const url = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  logger.info(`[S3] Uploaded key=${key}`);
  return url;
};

export const buildUploadKey = (userId: string, filename: string): string => {
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  return `uploads/${userId}/${timestamp}-${sanitized}`;
};
