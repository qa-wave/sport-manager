import { put, del } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob CDN.
 * Returns the public URL.
 */
export async function uploadBlob(
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const blob = await put(`documents/${filename}`, data, {
    access: 'public',
    contentType,
  });
  return blob.url;
}

/**
 * Delete a file from Vercel Blob by its URL.
 */
export async function deleteBlob(url: string): Promise<void> {
  await del(url);
}

/**
 * Returns true when Vercel Blob is configured in this environment.
 */
export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
