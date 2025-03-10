import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1]; // Check both cookies & headers

    if (!token) {
      res.status(401).json({ message: "Access Denied: No token provided" });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables.");
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.id ||
      !decoded.email ||
      !decoded.role
    ) {
      res.status(403).json({ message: "Invalid token payload" });
      return;
    }

    req.user = {
      id: decoded.id as string,
      email: decoded.email as string,
      role: decoded.role as string,
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res
      .status(403)
      .json({ message: "Access Denied: Invalid or expired token" });
    return;
  }
};
