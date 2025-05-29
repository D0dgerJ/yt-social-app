export interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  parentId?: number | null;
  images?: string[];
  user: {
    id: number;
    username: string;
    profilePicture?: string;
  };
  _count?: { likes: number };
  likes?: { userId: number }[];
  replies?: Comment[];
}
