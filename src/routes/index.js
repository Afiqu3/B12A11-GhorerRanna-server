const registerAuthRoutes = require("./auth");
const registerUsersRoutes = require("./users");
const registerChefAdminRoutes = require("./chefAdmin");
const registerMealsRoutes = require("./meals");
const registerFavoritesRoutes = require("./favorites");
const registerReviewsRoutes = require("./reviews");
const registerOrdersRoutes = require("./orders");
const registerPaymentsRoutes = require("./payments");

function registerRoutes(app, collections, stripe) {
  registerAuthRoutes(app);
  registerUsersRoutes(app, collections);
  registerChefAdminRoutes(app, collections);
  registerMealsRoutes(app, collections);
  registerFavoritesRoutes(app, collections);
  registerReviewsRoutes(app, collections);
  registerOrdersRoutes(app, collections);
  registerPaymentsRoutes(app, collections, stripe);
}

module.exports = { registerRoutes };
