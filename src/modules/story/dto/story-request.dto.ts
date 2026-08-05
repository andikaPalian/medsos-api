export interface CreateMediaInput {
  url: string;
  urlPublicId: string;
  type: "IMAGE" | "VIDEO";
}

export interface CreateStoryInput {
  userId: string;
  isCloseFriends: boolean;
  media: CreateMediaInput[];
}
