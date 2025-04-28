import { loginUser, registerUser } from "../services/auth.service.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const newUser = await registerUser(req.body);
    const { password, ...userData } = newUser;

    res.status(200).json({
      userData,
      message: "User has been registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Error Occurred Registering User",
    });
    console.log(error);
  }
};

export const login = async (req, res) => {
  try {
    const user = await loginUser(req.body, res);
    const { password, ...userData } = user;

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: "User logged in successfully",
      token,
      userData,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Error Occurred logging in the User",
    });
    console.log(error);
  }
};