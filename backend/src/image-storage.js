import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { invalidRequest } from './middleware.js';

const uploadDirectory = fileURLToPath(new URL('../uploads/', import.meta.url));
const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const maxBytes = 5 * 1024 * 1024;

export async function saveImage(image) {
  if (typeof image?.content !== 'string' || !image.content.trim()) {
    throw invalidRequest('Cada imagem precisa conter um campo content válido.');
  }

  if (/^https?:\/\//i.test(image.content) || image.content.startsWith('/')) {
    return image.content;
  }

  const match = image.content.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/);
  const mimeType = image.type ?? match?.[1];
  const extension = allowedTypes.get(mimeType);
  const encoded = match?.[2] ?? image.content;

  if (!extension || !/^[a-zA-Z0-9+/=]+$/.test(encoded)) {
    throw invalidRequest('Formato de imagem inválido. Use JPEG, PNG ou WebP.');
  }

  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length || buffer.length > maxBytes) {
    throw invalidRequest('A imagem deve ter no máximo 5 MB.');
  }

  await mkdir(uploadDirectory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(uploadDirectory, filename), buffer, { flag: 'wx' });
  return `/uploads/${filename}`;
}
