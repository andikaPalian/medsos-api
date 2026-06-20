import { User } from "@prisma/client";
import { prisma } from "../../../config/client.js"

export const findUserById = async (userId: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    }
  })
}