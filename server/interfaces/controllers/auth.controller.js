import { loginUser } from "../../application/use-cases/auth/loginUser.js";
import { registerUser } from "../../application/use-cases/auth//registerUser.js";

export const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { token, user } = await loginUser(req.body);
    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

