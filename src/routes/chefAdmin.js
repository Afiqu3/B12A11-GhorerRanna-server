const { ObjectId } = require("mongodb");
const { verifyJWTToken } = require("../middleware/auth");

function registerChefAdminRoutes(
  app,
  { chefRequestsCollection, adminRequestsCollection },
) {
  app.get("/chef-requests", verifyJWTToken, async (req, res) => {
    const requests = await chefRequestsCollection.find().toArray();
    res.send(requests);
  });

  app.get("/chef-requests/:email/check", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const request = await chefRequestsCollection.findOne({ userEmail: email });

    if (request) {
      return res.send({ requested: true });
    }

    res.send({ requested: false });
  });

  app.post("/chef-requests", verifyJWTToken, async (req, res) => {
    const request = req.body;
    request.requestStatus = "pending";
    request.requestTime = new Date();

    const result = await chefRequestsCollection.insertOne(request);
    res.send(result);
  });

  app.patch("/chef-requests/:id/status", verifyJWTToken, async (req, res) => {
    const id = req.params.id;
    const newStatus = req.body.status;

    const result = await chefRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { requestStatus: newStatus } },
    );

    res.send(result);
  });

  app.get("/admin-requests", verifyJWTToken, async (req, res) => {
    const requests = await adminRequestsCollection.find().toArray();
    res.send(requests);
  });

  app.get("/admin-requests/:email/check", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const request = await adminRequestsCollection.findOne({ userEmail: email });

    if (request) {
      return res.send({ requested: true });
    }

    res.send({ requested: false });
  });

  app.post("/admin-requests", verifyJWTToken, async (req, res) => {
    const request = req.body;
    request.requestStatus = "pending";
    request.requestTime = new Date();

    const result = await adminRequestsCollection.insertOne(request);
    res.send(result);
  });

  app.patch("/admin-requests/:id/status", verifyJWTToken, async (req, res) => {
    const id = req.params.id;
    const newStatus = req.body.status;

    const result = await adminRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { requestStatus: newStatus } },
    );

    res.send(result);
  });
}

module.exports = registerChefAdminRoutes;
