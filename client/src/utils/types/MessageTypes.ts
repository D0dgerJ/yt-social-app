export type MediaType =
  | 'image'
  | 'video'
  | 'file'
  | 'gif'
  | 'audio'
  | 'text'
  | 'sticker'
  | null;

export type UserLite = {
  id: number;
  username?: string | null;
  profilePicture?: string | null;
};

export type RepliedToLite = {
  id: number;
  senderId: number;

  encryptedContent?: string | null;
  content?: string; 

  mediaUrl?: string | null;
  mediaType?: MediaType;
  fileName?: string | null;

  isDeleted?: boolean;
  sender?: UserLite | null;
};

export interface Message {
  id: number;
  conversationId: number;

  clientMessageId?: string | null;
  senderId: number;

  encryptedContent?: string | null;

  mediaUrl?: string | null;
  mediaType?: MediaType;
  fileName?: string | null;
  gifUrl?: string | null;
  stickerUrl?: string | null;

  repliedToId?: number | null;
  repliedTo?: RepliedToLite | null;

  isDelivered: boolean;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string | null;

  createdAt: string;  
  updatedAt?: string | null;

  sender: UserLite;
}
