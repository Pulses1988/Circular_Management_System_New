const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "f47da57fdab5d8fdbe2b7855db15c11304197f2941d340cd302bbcddee0f04117f4ae1a5fbdb1e0a64f8f727587e3442bf9b44be6811f7f9c383f4860380b7f7";

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
