import * as FileSystem from 'expo-file-system/legacy';

export async function putToS3(uploadUrl: string, fileUri: string, contentType: string) {
  const res = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': contentType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (res.status !== 200) throw new Error(`Upload failed: ${res.status}`);
}