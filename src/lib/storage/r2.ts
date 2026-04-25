import { createHash, createHmac } from "node:crypto";

export interface R2ObjectInput {
  body: Buffer;
  contentType: string;
  key: string;
}

export interface R2StoredObject {
  body: ReadableStream<Uint8Array> | null;
  contentLength: string | null;
  contentType: string | null;
}

interface R2Config {
  accessKeyId: string;
  accountId: string;
  bucket: string;
  endpoint: string;
  publicUrl: string | null;
  secretAccessKey: string;
}

const R2_REGION = "auto";
const R2_SERVICE = "s3";
const EMPTY_BODY_HASH = sha256Hex("");

export async function uploadR2Object({
  body,
  contentType,
  key,
}: R2ObjectInput): Promise<string | null> {
  const config = getR2Config();
  const response = await signedR2Fetch(config, key, {
    body,
    contentType,
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error("Cloudflare R2 upload failed.");
  }

  return createPublicFileUrl(config, key);
}

export async function deleteR2Object(key: string): Promise<void> {
  const config = getR2Config();
  const response = await signedR2Fetch(config, key, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error("Cloudflare R2 delete failed.");
  }
}

export async function getR2Object(key: string): Promise<R2StoredObject | null> {
  const config = getR2Config();
  const response = await signedR2Fetch(config, key, {
    method: "GET",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Cloudflare R2 download failed.");
  }

  return {
    body: response.body,
    contentLength: response.headers.get("content-length"),
    contentType: response.headers.get("content-type"),
  };
}

function getR2Config(): R2Config {
  const accountId = getEnvValue("CLOUDFLARE_R2_ACCOUNT_ID", "R2_ACCOUNT_ID");
  const accessKeyId = getEnvValue("CLOUDFLARE_R2_ACCESS_KEY_ID", "R2_ACCESS_KEY_ID");
  const secretAccessKey = getEnvValue("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "R2_SECRET_ACCESS_KEY");
  const bucket = getEnvValue("CLOUDFLARE_R2_BUCKET", "R2_BUCKET_NAME");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("File uploads are not configured yet.");
  }

  return {
    accessKeyId,
    accountId,
    bucket,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    publicUrl: getEnvValue("CLOUDFLARE_R2_PUBLIC_URL", "R2_PUBLIC_URL") ?? null,
    secretAccessKey,
  };
}

function getEnvValue(primaryName: string, aliasName: string) {
  return process.env[primaryName] ?? process.env[aliasName];
}

async function signedR2Fetch(
  config: R2Config,
  key: string,
  options: {
    body?: Buffer;
    contentType?: string;
    method: "DELETE" | "GET" | "PUT";
  },
) {
  const now = new Date();
  const amzDate = formatAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const encodedKey = encodeR2Key(key);
  const canonicalUri = `/${config.bucket}/${encodedKey}`;
  const url = `${config.endpoint}${canonicalUri}`;
  const host = new URL(config.endpoint).host;
  const payloadHash = options.body ? sha256Hex(options.body) : EMPTY_BODY_HASH;
  const headerValues: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (options.contentType) {
    headerValues["content-type"] = options.contentType;
  }

  const signedHeaders = Object.keys(headerValues).sort().join(";");
  const canonicalHeaders = Object.keys(headerValues)
    .sort()
    .map((headerName) => `${headerName}:${headerValues[headerName]}`)
    .join("\n");
  const canonicalRequest = [
    options.method,
    canonicalUri,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = getSignatureKey(config.secretAccessKey, dateStamp);
  const signature = hmacHex(signingKey, stringToSign);

  const headers = new Headers(
    Object.entries(headerValues).filter(([headerName]) => headerName !== "host"),
  );

  headers.set(
    "authorization",
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  );

  const requestBody = options.body
    ? (options.body.buffer.slice(
        options.body.byteOffset,
        options.body.byteOffset + options.body.byteLength,
      ) as ArrayBuffer)
    : undefined;

  return fetch(url, {
    body: requestBody,
    headers,
    method: options.method,
  });
}

function createPublicFileUrl(config: R2Config, key: string) {
  if (!config.publicUrl) {
    return null;
  }

  return `${config.publicUrl.replace(/\/+$/g, "")}/${encodeR2Key(key)}`;
}

function encodeR2Key(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function formatAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function sha256Hex(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function getSignatureKey(secretAccessKey: string, dateStamp: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, R2_REGION);
  const serviceKey = hmac(regionKey, R2_SERVICE);

  return hmac(serviceKey, "aws4_request");
}
