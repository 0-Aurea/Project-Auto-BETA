const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const config = require('../lib/config');
const logger = require('../lib/logger');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies['nexus-auth-token'];
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, config.server.auth.secret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

const generateToken = (user) => {
  const token = jwt.sign(user, config.server.auth.secret, {
    expiresIn: '1h',
  });
  return token;
};

const authMiddleware = async (req, res, next) => {
  try {
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (req.url.startsWith('/api') || req.url.startsWith('/auth')) {
      return next();
    }

    await authenticate(req, res, next);
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send({ error: 'Invalid request' });
    }

    const user = { username, role: 'user' };
    const token = generateToken(user);
    res.cookie('nexus-auth-token', token, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000,
    });
    res.send({ token });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie('nexus-auth-token');
    res.send({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

module.exports = { authMiddleware, login, logout };