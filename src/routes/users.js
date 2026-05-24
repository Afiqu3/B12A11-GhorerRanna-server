const { verifyJWTToken } = require("../middleware/auth");
const { generateChefId } = require("../utils/helpers");

function registerUsersRoutes(app, { usersCollection }) {
  app.get("/users", verifyJWTToken, async (req, res) => {
    const cursor = usersCollection.find();
    const users = await cursor.toArray();
    res.send(users);
  });

  app.get("/users/:email/info", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const user = await usersCollection.findOne({ email });
    res.send(user);
  });

  app.get("/users/:email/role", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const user = await usersCollection.findOne({ email });
    res.send({ role: user?.role || "user" });
  });

  app.post("/users", async (req, res) => {
    const user = req.body;
    user.role = "user";
    user.createdAt = new Date();
    user.status = "active";

    const email = user.email;
    const userExists = await usersCollection.findOne({ email });

    if (userExists) {
      return res.send({ message: "user exists" });
    }

    const result = await usersCollection.insertOne(user);
    res.send(result);
  });

  app.patch("/users/:email/role", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const newRole = req.body.role;

    const updateDoc = {
      $set: {
        role: newRole,
      },
    };

    if (newRole === "chef") {
      const chefId = generateChefId();
      let chefIdExists = await usersCollection.findOne({ chefId });

      while (chefIdExists) {
        const newChefId = generateChefId();
        chefIdExists = await usersCollection.findOne({ chefId: newChefId });
      }

      updateDoc.$set.chefId = chefId;
    }

    const result = await usersCollection.updateOne({ email }, updateDoc);
    res.send(result);
  });

  app.patch("/users/:email/status", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const newStatus = req.body.status;

    const result = await usersCollection.updateOne(
      { email },
      { $set: { status: newStatus } },
    );

    res.send(result);
  });

  app.patch("/users/:email/info", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const updatedInfo = req.body;

    const result = await usersCollection.updateOne(
      { email },
      { $set: { ...updatedInfo } },
    );

    res.send(result);
  });
}

module.exports = registerUsersRoutes;
