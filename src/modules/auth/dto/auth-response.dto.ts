import { User } from "@prisma/client";

export type AuthenticatedUserResponse = Omit<
  User,
  "password" | "verificationToken" | "verificationTokenExpiry"
>;

export interface LoginResponseDTO {
  user: AuthenticatedUserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponseDTO {
  accessToken: string;
  refreshToken: string;
}

export type GoogleLoginResponseDTO =
  | {
      isNewUser: true;
      registerToken: string;
    }
  | {
      isNewUser: false;
      user: AuthenticatedUserResponse;
    };
