const express = require('express');
const cookieParser = require('cookie-parser');
const config = require('./config');
const logger = require('./logger');

const cookieScoping = (req, res, next) => {
  const { hostname: proxiedHost } = req.headers['x-nexus-proxied-host'];
  const { cookies } = req;

  if (!proxiedHost) {
    return res.status(400).send({ error: 'Bad Request' });
  }

  Object.keys(cookies).forEach((cookieName) => {
    const cookieValue = cookies[cookieName];
    const scopedCookieName = `${cookieName}=${proxiedHost}`;

    if (cookieName.startsWith('nexus=')) {
      // Nexus-specific cookies are preserved
      return;
    }

    if (cookieName.includes('=')) {
      // Ignore cookies with '=' in name ( Edge case handling )
      return;
    }

    res.clearCookie(cookieName);

    if (proxiedHost) {
      res.cookie(scopedCookieName, cookieValue, {
        httpOnly: true,
        secure: config.server.https.enabled,
        sameSite: 'strict',
        path: '/',
      });
    }
  });

  req.cookies = {};

  Object.keys(req.headers).forEach((headerName) => {
    if (headerName.startsWith('cookie')) {
      const cookieHeader = req.headers[headerName];
      const cookies = cookieHeader.split(';');

      cookies.forEach((cookie) => {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        const scopedCookieName = `${cookieName.trim()}=${proxiedHost}`;

        if (cookieName.trim().startsWith('nexus=')) {
          // Nexus-specific cookies are preserved
          req.cookies[cookieName.trim()] = cookieValue.trim();
          return;
        }

        if (cookieName.trim().includes('=')) {
          // Ignore cookies with '=' in name ( Edge case handling )
          return;
        }

        req.cookies[scopedCookieName] = cookieValue.trim();
      });
    }
  });

  next();
};

module.exports = cookieScoping;