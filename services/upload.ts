// Binary upload helper using Expo FileSystem (legacy namespace).
// Sends the selected image to the S3/MinIO presigned URL with correct Content-Type.
import * as FileSystem from 'expo-file-system/legacy';

// PUT to presigned URL with raw binary
export async function putToS3(uploadUrl: string, fileUri: string, contentType: string) {
  const res = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': contentType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (res.status !== 200) throw new Error(`Upload failed: ${res.status}`);
}