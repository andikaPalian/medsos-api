export interface UpdateUserDataDTO {
  username?: string;
  profilePic?: Express.Multer.File;
  fullName?: string | null;
  bio?: string | null;
  isPrivate?: boolean;
}

export interface UserUpdateData {
  username?: string;
  fullName?: string | null;
  bio?: string | null;
  isPrivate?: boolean;
  profilePic?: string;
  profilePublicId?: string;
}
