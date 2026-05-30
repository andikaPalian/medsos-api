import prisma from "../../../config/client.js";

// Function to find a user by email
export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
};

// Function to find a user by username
export const findUserByUsername = async (username) => {
  return await prisma.user.findUnique({
    where: {
      username: username,
    },
  });
};

// Function to find a user by reset password token
export const findUserByToken = async (token) => {
  return await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: {
        gt: new Date(),
      },
    },
  });
};

// Function to find a linked account by provider and providerAccountId
export const findLinkedAccount = async (provider, providerAccountId) => {
  return await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
  });
};

// Function to create a linked account
export const linkedAccount = async (userId, provider, providerAccountId) => {
  return await prisma.account.create({
    data: {
      userId,
      provider,
      providerAccountId,
    },
  });
};

// Function to create a new user
export const createUser = async (userData) => {
  return await prisma.user.create({
    data: userData,
  });
};

export const createUserWithAccount = async (userData, providerData) => {
  return await prisma.user.create({
    data: {
      ...userData,
      accounts: {
        create: providerData,
      },
    },
  });
};

// Function to update user data by email
export const updateUserByEmail = async (email, updateData) => {
  return await prisma.user.update({
    where: {
      email: email,
    },
    data: updateData,
  });
};

// Function to update user data by ID
export const updateUserById = async (userId, updateData) => {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: updateData,
  });
};
