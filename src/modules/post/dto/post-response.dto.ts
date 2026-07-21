export interface PostAuthorDTO {
  id: string;
  username: string;
  profilePic: string | null;
}

export interface PostMediaDTO {
  id: string;
  url: string;
  type: string;
}

export interface PostResponseDTO {
  id: string;
  caption: string | null;
  totalLikes: number;
  totalComments: number;
  createdAt: Date;
  author: PostAuthorDTO;
  media: PostMediaDTO[];
  isLiked: boolean;
  isSaved: boolean;
}

export interface PaginatedFeedDTO {
  data: PostResponseDTO[];
  hasNextPage: boolean;
  nextCursor: string | null;
}
