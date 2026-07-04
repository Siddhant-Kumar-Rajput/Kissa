/**
 * Simple in-memory rate limiting middleware
 * to prevent Gemini API request overflow.
 */
const rateLimit = (maxRequests, windowMs) => {
  const requests = {}; // Map of IP address -> Array of timestamps

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!requests[ip]) {
      requests[ip] = [];
    }

    // Filter out timestamps older than the window
    requests[ip] = requests[ip].filter(timestamp => now - timestamp < windowMs);

    if (requests[ip].length >= maxRequests) {
      return res.status(429).json({
        error: "Too many requests. Please wait a minute before trying again.",
        message: "API request limit exceeded to prevent AI API overflow."
      });
    }

    requests[ip].push(now);
    next();
  };
};

module.exports = rateLimit;
