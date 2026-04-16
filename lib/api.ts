import { API_BASE_URL } from '@/constants/env';

export interface GenerateResult {
  url: string;
}

export async function generateImage(
  prompt: string,
  imageUri: string,
  accessToken: string
): Promise<GenerateResult> {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('image', {
    uri: imageUri,
    name: 'upload.png',
    type: 'image/png',
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
    // Do NOT set Content-Type — fetch sets multipart boundary automatically
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<GenerateResult>;
}
