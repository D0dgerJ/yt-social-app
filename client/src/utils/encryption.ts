export const encrypt = (text: string): string => {
  return btoa(unescape(encodeURIComponent(text))); // Преобразуем в Base64
};

export const decrypt = (encoded: string): string => {
  return decodeURIComponent(escape(atob(encoded))); // Дешифруем из Base64
};