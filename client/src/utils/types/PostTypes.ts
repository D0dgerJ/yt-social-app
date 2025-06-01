export interface PostType {
  id: number;
  userId: number;
  desc?: string;
  createdAt: string;
  likes: number[];
  comment?: number;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
  user: {
    id: number;
    username: string;
    profilePicture?: string;
  };
}