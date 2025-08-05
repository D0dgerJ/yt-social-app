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

  return {
    fileUrl: response.data.fileUrl,
    fileType: response.data.fileType,
  };
};
