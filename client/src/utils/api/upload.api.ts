import axios from './axiosInstance';

interface UploadResponse {
  fileUrl: string;
  fileType: string;
  fileName?: string;
  fileSize?: number;
}


export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  return {
    fileUrl: `${baseUrl}${response.data.fileUrl}`,
    fileType: response.data.fileType,
    fileName: response.data.fileName,
    fileSize: response.data.fileSize,
  };
};