const jwt = require("jsonwebtoken");

function registerAuthRoutes(app) {
  app.post("/getToken", async (req, res) => {
    const loggedUser = req.body;
    const token = jwt.sign(loggedUser, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    res.send({ token });
  });
}

module.exports = registerAuthRoutes;
