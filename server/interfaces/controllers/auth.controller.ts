import { Request, Response } from "express";
import { registerUser } from "../../application/use-cases/auth/registerUser.ts";
import { loginUser } from "../../application/use-cases/auth/loginUser.ts";

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const token = await registerUser({ username, email, password });
    res.status(201).json({ token });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await loginUser({ email, password });
    res.status(200).json({ token });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};
