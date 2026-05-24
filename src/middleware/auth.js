const jwt = require("jsonwebtoken");

function verifyJWTToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Unauthorized access" });
    }

    req.token_email = decoded.email;
    next();
  });
}

module.exports = { verifyJWTToken };
