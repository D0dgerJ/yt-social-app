import { loginUser } from "../../application/use-cases/auth/loginUser.js";
import { registerUser } from "../../application/use-cases/auth//registerUser.js";
import { registerSchema, loginSchema } from "../../validation/authSchemas.js";

export const register = async (req, res, next) => {
  try {
    registerSchema.parse(req.body);

    const user = await registerUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    loginSchema.parse(req.body);

    const data = await loginUser(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

