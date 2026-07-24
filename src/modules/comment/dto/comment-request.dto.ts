export interface CreateCommentDTO {
  authorId: string;
  authorUsername: string;
  postId: string;
  content: string;
  parentId?: string | null;
}

export interface CreateReplyDTO extends CreateCommentDTO {
  commentId: string;
}

export interface GetCommentstDTO {
  viewerId: string;
  postId: string;
  limit: number;
  cursor: string | null;
}
