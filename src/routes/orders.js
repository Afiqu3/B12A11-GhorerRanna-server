const { ObjectId } = require("mongodb");
const { verifyJWTToken } = require("../middleware/auth");

function registerOrdersRoutes(app, { ordersCollection }) {
  app.get("/orders", verifyJWTToken, async (req, res) => {
    const orders = await ordersCollection.find().toArray();
    res.send(orders);
  });

  app.get("/orders/:chefId", verifyJWTToken, async (req, res) => {
    const chefId = req.params.chefId;
    const orders = await ordersCollection
      .find({ chefId })
      .sort({ orderTime: -1 })
      .toArray();

    res.send(orders);
  });

  app.get("/orders/:email/user", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const orders = await ordersCollection
      .find({ userEmail: email })
      .sort({ orderTime: -1 })
      .toArray();

    res.send(orders);
  });

  app.post("/orders", verifyJWTToken, async (req, res) => {
    const order = req.body;
    order.orderTime = new Date();

    const result = await ordersCollection.insertOne(order);
    res.send(result);
  });

  app.patch("/orders/:id/status", verifyJWTToken, async (req, res) => {
    const id = req.params.id;
    const newStatus = req.body.status;

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { orderStatus: newStatus } },
    );

    res.send(result);
  });
}

module.exports = registerOrdersRoutes;
