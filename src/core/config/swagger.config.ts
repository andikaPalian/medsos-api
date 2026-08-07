import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.config.js";
import { API_PREFIX } from "@core/constants/app.constants.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Media Social API Documentation",
      version: "1.0.0",
      description:
        "Enterprise REST API documentation for Social Media Platform built with Express 5, TypeScript, and Prisma. Features Authentication, Encrypted Messaging, Real-time WebSockets, Post Feed, and Story Management.",
      contact: {
        name: "API Support",
        email: "support@mediasocial.com",
      },
    },
    servers: [
      {
        url: `${env.BACKEND_URL}${API_PREFIX}`,
        description: "Current Server",
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication, Registration, OTP, OAuth & Password Management" },
      { name: "Users", description: "User Profiles, Settings & Privacy" },
      { name: "Posts", description: "Feed, Post Creation, Saved Items & Media" },
      { name: "Comments", description: "Post Comments & Threaded Replies" },
      { name: "Likes", description: "Post Likes & Interactivity" },
      { name: "Follows", description: "Follow Relationships & Private Requests" },
      { name: "Stories", description: "Expiring Stories & Story Viewers" },
      { name: "Messages", description: "Encrypted Direct Messaging & Attachment Download" },
      { name: "Notifications", description: "User Notifications & Read States" },
      { name: "Reports", description: "Content Moderation & Post Reporting" },
      { name: "Blocks", description: "User Block List & Management" },
      { name: "Close Friends", description: "Close Friends List Management" },
      { name: "Search", description: "User & Content Search" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT Access Token",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "HTTP-only Access Token Cookie",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation completed successfully" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Invalid input or unauthorized" },
            code: { type: "string", example: "BAD_REQUEST" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            username: { type: "string", example: "johndoe" },
            fullName: { type: "string", example: "John Doe" },
            bio: { type: "string", example: "Software Engineer" },
            profilePic: { type: "string", example: "https://cloudinary.com/pic.jpg" },
            isPrivate: { type: "boolean", example: false },
            isVerified: { type: "boolean", example: true },
            followersCount: { type: "integer", example: 120 },
            followingCount: { type: "integer", example: 85 },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
        cookieAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.routes.ts", "./src/modules/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
