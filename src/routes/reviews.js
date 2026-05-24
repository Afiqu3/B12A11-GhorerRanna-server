const { ObjectId } = require("mongodb");
const { verifyJWTToken } = require("../middleware/auth");

function registerReviewsRoutes(app, { reviewsCollection, mealsCollection }) {
  app.get("/reviews", async (req, res) => {
    const reviews = await reviewsCollection.find().sort({ date: -1 }).toArray();

    res.send(reviews);
  });

  app.get("/reviews/meal/:mealId", async (req, res) => {
    const mealId = req.params.mealId;
    const reviews = await reviewsCollection
      .find({ mealId })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(reviews);
  });

  app.get("/reviews/user/:email", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const reviews = await reviewsCollection
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(reviews);
  });

  app.post("/reviews", verifyJWTToken, async (req, res) => {
    const review = req.body;
    const result = await reviewsCollection.insertOne(review);

    const mealId = review.mealId;
    const meal = await mealsCollection.findOne({ _id: new ObjectId(mealId) });
    const newReviewCount = (meal.reviewCount || 0) + 1;
    const newReviewSum = (meal.reviewSum || 0) + review.rating;

    await mealsCollection.updateOne(
      { _id: new ObjectId(mealId) },
      {
        $set: {
          reviewCount: newReviewCount,
          reviewSum: newReviewSum,
          rating: newReviewSum / newReviewCount,
        },
      },
    );

    res.send(result);
  });

  app.patch("/reviews/:id", verifyJWTToken, async (req, res) => {
    const id = req.params.id;
    const updatedReview = req.body;

    const result = await reviewsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updatedReview } },
    );

    res.send(result);
  });

  app.delete("/reviews/:id", verifyJWTToken, async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const review = await reviewsCollection.findOne(filter);

    const mealId = review.mealId;
    const meal = await mealsCollection.findOne({ _id: new ObjectId(mealId) });
    const newReviewCount = (meal.reviewCount || 1) - 1;
    const newReviewSum = (meal.reviewSum || 0) - review.rating;

    await mealsCollection.updateOne(
      { _id: new ObjectId(mealId) },
      {
        $set: {
          reviewCount: newReviewCount,
          reviewSum: newReviewSum,
          rating: newReviewCount ? newReviewSum / newReviewCount : 0,
        },
      },
    );

    const result = await reviewsCollection.deleteOne(filter);
    res.send(result);
  });
}

module.exports = registerReviewsRoutes;
