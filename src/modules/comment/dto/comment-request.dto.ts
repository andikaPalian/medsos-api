export interface CreateCommentDTO {
  authorId: string;
  postId: string;
  content: string;
  parentId?: string | null;
}

export interface CreateReplyDTO {
  authorId: string;
  postId: string;
  commentId: string;
  content: string;
}

export interface GetCommentstDTO {
  viewerId: string;
  postId: string;
  limit: number;
  cursor: string | null;
}
