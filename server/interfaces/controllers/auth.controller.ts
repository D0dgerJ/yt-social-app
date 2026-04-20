import { Request, Response } from "express";
import { registerUser } from "../../application/use-cases/auth/registerUser.js";
import { loginUser } from "../../application/use-cases/auth/loginUser.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    const user = await registerUser({ username, email, password });
    res.status(201).json(user);
  } catch (error: any) {
    const message = error?.message || "Registration failed";

    if (message === "User already exists") {
      res.status(409).json({ message });
      return;
    }

    res.status(400).json({ message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await loginUser({ email, password });
    res.status(200).json(user);
  } catch {
    res.status(401).json({ message: "Invalid email or password" });
  }
};