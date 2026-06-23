import { UAParser } from "ua-parser-js";
import { Request } from "express";

interface ExtractedContent {
  browser: string;
  os: string;
  ipAddress: string;
}

export const extractSecurityContext = (req: Request): ExtractedContent => {
  const ipAddress = (req.ip || req.headers["x-forwarded-for"] || "unknown") as string;

  const userAgentString = req.headers["user-agent"] || "";
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown Browser";
  const osName = result.os.name || "Unknown OS";
  const osVersion = result.os.version ? `${result.os.version}` : "";
  const os = `${osName}${osVersion}`;

  return { browser, os, ipAddress };
};
