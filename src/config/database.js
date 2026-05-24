const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.DB_HOST;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

function createCollections() {
  const ghorerRannaDB = client.db("ghorerRannaDB");

  return {
    usersCollection: ghorerRannaDB.collection("users"),
    chefRequestsCollection: ghorerRannaDB.collection("chefRequests"),
    adminRequestsCollection: ghorerRannaDB.collection("adminRequests"),
    mealsCollection: ghorerRannaDB.collection("meals"),
    favoritesMealCollection: ghorerRannaDB.collection("favorites"),
    reviewsCollection: ghorerRannaDB.collection("reviews"),
    ordersCollection: ghorerRannaDB.collection("orders"),
    paymentHistoryCollection: ghorerRannaDB.collection("paymentHistory"),
  };
}

module.exports = { createCollections };
