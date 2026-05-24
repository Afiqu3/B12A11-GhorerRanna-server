const { ObjectId } = require("mongodb");
const { verifyJWTToken } = require("../middleware/auth");

function registerFavoritesRoutes(app, { favoritesMealCollection }) {
  app.get("/favorites/:email", verifyJWTToken, async (req, res) => {
    const email = req.params.email;
    const favorites = await favoritesMealCollection
      .find({ userEmail: email })
      .toArray();

    res.send(favorites);
  });

  app.get("/favoritesCheck", verifyJWTToken, async (req, res) => {
    const mealId = req.query.mealId;
    const email = req.query.email;
    const favorite = await favoritesMealCollection.findOne({
      mealId,
      userEmail: email,
    });

    if (favorite) {
      return res.send({ favorite: true });
    }

    res.send({ favorite: false });
  });

  app.post("/favorites", verifyJWTToken, async (req, res) => {
    const favorite = req.body;
    favorite.addedAt = new Date();

    const result = await favoritesMealCollection.insertOne(favorite);
    res.send(result);
  });

  app.delete("/favorites/:id", verifyJWTToken, async (req, res) => {
    const id = req.params.id;
    const result = await favoritesMealCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.send(result);
  });
}

module.exports = registerFavoritesRoutes;
