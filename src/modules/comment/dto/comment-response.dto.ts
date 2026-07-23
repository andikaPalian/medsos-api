interface CommentAuthorDTO {
  id: string;
  profilePic: string | null;
  username: string;
}

export interface CommentReplyDTO {
  id: string;
  content: string;
  createdAt: Date;
  author: CommentAuthorDTO;
}

export interface CommentResponseDTO {
  id: string;
  content: string;
  createdAt: Date;
  author: CommentAuthorDTO;
  totalReplies: number;
  replies: CommentReplyDTO[];
}

export interface PaginatedCommentDTO {
  data: CommentResponseDTO[];
  nextCursor: string | null;
  hasNextPage: boolean;
}
