# GhorerRanna Server

> Backend API for the GhorerRanna application — a home-cooked meals marketplace.

## Overview

This Node.js + Express server implements the REST API for GhorerRanna. It includes user management, chef/admin request handling, meal listings, favorites, reviews, order processing, and Stripe payments. MongoDB is used as the primary datastore.

Key features:
- JWT-based authentication
- Role management (user, chef, admin) and chef ID generation
- Meal CRUD with pagination, sorting and search
- Favorites, reviews (with meal rating aggregation)
- Orders and Stripe Checkout integration
- Payment history recording

## Requirements

- Node.js
- A MongoDB connection URI
- A Stripe account and secret key


## API Summary

Authentication: endpoints that require authentication expect a Bearer token in the `Authorization` header (`Authorization: Bearer <token>`). Tokens are issued by `POST /getToken`.

Selected endpoints:

- `POST /getToken` — Issue a JWT for a logged user (accepts user object in body).

- Users
  - `GET /users` — List all users (protected)
  - `GET /users/:email/info` — Get user info (protected)
  - `GET /users/:email/role` — Get user's role (protected)
  - `POST /users` — Create a user
  - `PATCH /users/:email/role` — Update user role (assigns chefId when role is `chef`) (protected)
  - `PATCH /users/:email/status` — Update user status (protected)

- Chef requests
  - `GET /chef-requests` — List chef requests (protected)
  - `GET /chef-requests/:email/check` — Check if a user has requested chef role (protected)
  - `POST /chef-requests` — Create chef request (protected)
  - `PATCH /chef-requests/:id/status` — Update request status (protected)

- Admin requests (similar to chef requests)

- Meals
  - `GET /meals` — List meals with `page`, `limit`, `sort` and `search` query params
  - `GET /latest-meals` — Get latest 6 meals
  - `GET /meals/:email` — Get meals for a user (protected)
  - `GET /meals/:id/info` — Get meal info (protected)
  - `POST /meals` — Create meal (protected)
  - `PATCH /meals/:id` — Update meal (protected)
  - `DELETE /meals/:id` — Delete meal (protected)

- Favorites
  - `GET /favorites/:email` — List user's favorites (protected)
  - `GET /favoritesCheck` — Check favorite existence (protected)
  - `POST /favorites` — Add favorite (protected)
  - `DELETE /favorites/:id` — Remove favorite (protected)

- Reviews
  - `GET /reviews` — Get all reviews
  - `GET /reviews/meal/:mealId` — Reviews for a meal
  - `GET /reviews/user/:email` — Reviews by user (protected)
  - `POST /reviews` — Add review (protected) — also updates meal rating aggregation
  - `PATCH /reviews/:id` — Edit review (protected)
  - `DELETE /reviews/:id` — Delete review (protected) — adjusts meal rating aggregation

- Orders
  - `GET /orders` — List all orders (protected)
  - `GET /orders/:chefId` — Get orders by chef (protected)
  - `GET /orders/:email/user` — Get orders by user (protected)
  - `POST /orders` — Create order (protected)
  - `PATCH /orders/:id/status` — Update order status (protected)

- Payments
  - `POST /create-payment-session` — Create Stripe Checkout session (protected)
  - `PATCH /payment-success` — Mark payment success, update order and save payment history (protected)

Refer to the source `index.js` for exact request/response shapes and details.


