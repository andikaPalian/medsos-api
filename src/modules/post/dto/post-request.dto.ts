export interface CreateMediaInput {
  url: string;
  urlPublicId: string;
  type: "IMAGE" | "VIDEO";
}

export interface CreatePostInput {
  authorId: string;
  caption?: string | null;
  media: CreateMediaInput[];
}

export interface UpdatePostRequestDTO {
  userId: string;
  postId: string;
  caption?: string;
  tags?: string[];
  media?: CreateMediaInput[];
}

export interface PostUpdateData {
  caption?: string;
  tags?: string[];
  media?: CreateMediaInput[];
}

export interface GetFeedDTO {
  userId: string;
  limit: number;
  cursor: string | null;
}

export interface GetSavedPostsDTO {
  userId: string;
  limit: number;
  cursor: string | null;
}
