import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

export const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_HOST_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: env.EMAIL_LOGIN,
    pass: env.EMAIL_PASSWORD,
  },
});
