interface StoryMediaDTO {
  id: string;
  url: string;
  type: string;
}

interface StoryUserDTO {
  id: string;
  username: string;
  profilePic: string | null;
}

interface StoryViewerDTO {
  id: string;
  user: {
    id: string;
  };
}

export interface StoryResponseDTO {
  id: string;
  userId: string;
  isCloseFriends: boolean;
  user: StoryUserDTO;
  media: StoryMediaDTO[];
  viewers: StoryViewerDTO[];
  createdAt: Date;
  expiresAt: Date;
  totalViewers: number;
}

export interface StoryViewerResponseDTO {
  id: string;
  storyId: string;
  userId: string;
  viewedAt: Date;
  user: StoryUserDTO;
  story: {
    id: string;
  };
}
