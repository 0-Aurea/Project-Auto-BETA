const express = require('express');
const cookieParser = require('cookie-parser');
const config = require('./config');
const logger = require('./logger');

/**
 * Cookie scoping middleware to isolate cookies per proxied origin.
 * 
 * This middleware scopes cookies to the proxied host to prevent cookie collisions.
 * It clears and re-sets cookies with the proxied host as a suffix.
 * 
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @param {express.NextFunction} next - Express next function.
 */
const cookieScoping = async (req, res, next) => {
  try {
    const { hostname: proxiedHost } = req.headers['x-nexus-proxied-host'];
    if (!proxiedHost) {
      return res.status(400).send({ error: 'Bad Request' });
    }

    // Clear existing cookies
    Object.keys(req.cookies).forEach((cookieName) => {
      res.clearCookie(cookieName);
    });

    // Re-set cookies with scoped names
    Object.keys(req.headers).forEach((headerName) => {
      if (headerName.startsWith('cookie')) {
        const cookieHeader = req.headers[headerName];
        const cookies = cookieHeader.split(';');

        cookies.forEach((cookie) => {
          const [cookieName, cookieValue] = cookie.trim().split('=');
          const scopedCookieName = `${cookieName.trim()}=${proxiedHost}`;

          if (cookieName.trim().startsWith('nexus=')) {
            // Preserve Nexus-specific cookies
            res.cookie(scopedCookieName, cookieValue.trim(), {
              httpOnly: true,
              secure: config.server.https.enabled,
              sameSite: 'strict',
              path: '/',
            });
          } else if (!cookieName.trim().includes('=')) {
            // Set scoped cookies for non-Nexus cookies
            res.cookie(scopedCookieName, cookieValue.trim(), {
              httpOnly: true,
              secure: config.server.https.enabled,
              sameSite: 'strict',
              path: '/',
            });
          }
        });
      }
    });

    // Update req.cookies with scoped cookies
    req.cookies = {};
    Object.keys(req.headers).forEach((headerName) => {
      if (headerName.startsWith('cookie')) {
        const cookieHeader = req.headers[headerName];
        const cookies = cookieHeader.split(';');

        cookies.forEach((cookie) => {
          const [cookieName, cookieValue] = cookie.trim().split('=');
          const scopedCookieName = `${cookieName.trim()}=${proxiedHost}`;

          req.cookies[scopedCookieName] = cookieValue.trim();
        });
      }
    });

    next();
  } catch (error) {
    logger.error('Cookie scoping error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

module.exports = cookieScoping;