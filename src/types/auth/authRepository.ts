export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}

export interface UpdateAuthDataInput {
  isVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpiry?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordTokenExpiry?: Date | null;
  password?: string;
}
