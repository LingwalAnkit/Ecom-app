const jwt = require("jsonwebtoken");

function generateToken(user, isOwner = false) {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      role: isOwner ? 'owner' : 'user'
    },
    process.env.JWT_KEY,
    { expiresIn: '24h' }
  );
}

module.exports = { generateToken };