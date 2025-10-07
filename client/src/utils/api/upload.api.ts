import axios from './axiosInstance';

export interface UploadResponse {
  fileUrl: string;  
  fileType: string;
  fileName?: string;
  fileSize?: number;
}

function getOriginFromAxios(): string {
  try {
    const base = (axios as any)?.defaults?.baseURL || '';
    const url = new URL(base);
    return url.origin; 
  } catch {
    return window.location.origin;
  }
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const relative = String(response.data.fileUrl || '');
  const origin = getOriginFromAxios();
  const absolute = new URL(relative, origin).href;

  return {
    fileUrl: absolute,
    fileType: response.data.fileType,
    fileName: response.data.fileName,
    fileSize: response.data.fileSize,
  };
};