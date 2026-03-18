import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = "supersecret_change_this";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: "donor" | "user";
}

export function auth(requiredRole?: "donor" | "user") {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        role: "donor" | "user";
      };
      req.userId = payload.userId;
      req.userRole = payload.role;

      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

export function signToken(userId: number, role: "donor" | "user") {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1d" });
}
