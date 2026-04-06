/**
 * Google Drive backup service
 * Uploads JSON backup string to the user's Google Drive
 */

export async function uploadBackupToGoogleDrive(jsonString: string): Promise<void> {
  const token = localStorage.getItem('google_provider_token');
  if (!token) {
    throw new Error('Token do Google Drive não encontrado. Faça login novamente com o Google.');
  }

  const blob = new Blob([jsonString], { type: 'application/json' });
  const metadata = {
    name: `crm-backup-${new Date().toISOString().split('T')[0]}.json`,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Drive upload error:', err);
    throw new Error('Falha ao enviar backup para o Google Drive.');
  }
}
