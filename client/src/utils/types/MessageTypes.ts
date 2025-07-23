export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  encryptedContent?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'file' | 'gif' | 'audio' | 'text' | 'sticker';
  fileName?: string;
  gifUrl?: string;
  stickerUrl?: string;
  repliedToId?: number;
  isDelivered: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    username: string;
    profilePicture?: string;
  };
  repliedTo?: Message;
}
