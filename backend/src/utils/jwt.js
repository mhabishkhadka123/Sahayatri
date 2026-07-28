import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const generateToken = (userId) => {
  const authToken = jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });

  const refreshToken = jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.refreshTokenExpire,
  });

  return { authToken, refreshToken };
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};
