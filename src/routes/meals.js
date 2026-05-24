const { ObjectId } = require("mongodb");
const { verifyJWTToken } = require("../middleware/auth");

function registerMealsRoutes(app, { mealsCollection }) {
  app.get("/meals", async (req, res) => {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || "asc";
    const search = req.query.search || "";

    const query = { foodName: { $regex: search, $options: "i" } };
    const options = {
      sort: { price: sort === "asc" ? 1 : -1 },
    };

    const cursor = mealsCollection
      .find(query, options)
      .skip(page * limit)
      .limit(limit);

    const meals = await cursor.toArray();
    const totalMeals = await mealsCollection.countDocuments(query);

    res.send({ meals, totalMeals });
  });

  app.get("/latest-meals", async (req, res) => {
    const meals = await mealsCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray();

    res.send(meals);
  });

  app.get("/meals/:email", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const meals = await mealsCollection.find({ userEmail: email }).toArray();
    res.send(meals);
  });

  app.get("/meals/:id/info", async (req, res) => {
    const id = req.params.id;
    const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });
    res.send(meal);
  });

  app.post("/meals", verifyJWTToken, async (req, res) => {
    const meal = req.body;
    meal.createdAt = new Date();

    const result = await mealsCollection.insertOne(meal);
    res.send(result);
  });

  app.patch("/meals/:id", verifyJWTToken, async (req, res) => {
    const id = req.params.id;
    const updatedMeal = req.body;

    const result = await mealsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updatedMeal } },
    );

    res.send(result);
  });

  app.delete("/meals/:id", verifyJWTToken, async (req, res) => {
    const id = req.params.id;
    const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  });
}

module.exports = registerMealsRoutes;
