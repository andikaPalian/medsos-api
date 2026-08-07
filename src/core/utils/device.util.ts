// ============================================================
// User-Agent parsing and security context extraction
// ============================================================

import { UAParser } from "ua-parser-js";
import { Request } from "express";

export interface SecurityContext {
  browser: string;
  os: string;
  ipAddress: string;
}

export const extractSecurityContext = (req: Request): SecurityContext => {
  const rawIp = req.ip ?? "unknown";
  const ipAddress = rawIp === "::1" ? "127.0.0.1" : rawIp.replace(/^::ffff:/, "");

  const userAgentString = req.headers["user-agent"] || "";
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown Browser";
  const osName = result.os.name || "Unknown OS";
  const osVersion = result.os.version ? `${result.os.version}` : "";
  const os = `${osName} ${osVersion}`.trim();

  return { browser, os, ipAddress };
};
