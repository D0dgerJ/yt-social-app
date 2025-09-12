export type LikeEntity = number | { userId: number };

export interface PostCounts {
  likes?: number;
  comments?: number;
}

export interface PostUser {
  id: number;
  username: string;
  profilePicture?: string;
}

export interface PostType {
  id: number;
  userId: number;
  desc?: string;
  createdAt: string;

  likes: number[];

  comment?: number;        
  _count?: PostCounts;      

  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;

  user: PostUser;
}
