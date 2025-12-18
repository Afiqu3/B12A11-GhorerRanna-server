const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const verifyJWTToken = (req, res, next) => {
  // console.log(req.headers);
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  const token = authorization.split(' ')[1];
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: 'Unauthorized access' });
    }
    // console.log(decoded)
    req.token_email = decoded.email;
    next();
  });
};

function generateChefId() {
  const prefix = 'chef';
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNumber}`;
}

app.get('/', (req, res) => {
  res.send('Server is running');
});

const uri = process.env.DB_HOST;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const ghorerRannaDB = client.db('ghorerRannaDB');
    const usersCollection = ghorerRannaDB.collection('users');
    const chefRequestsCollection = ghorerRannaDB.collection('chefRequests');
    const adminRequestsCollection = ghorerRannaDB.collection('adminRequests');
    const mealsCollection = ghorerRannaDB.collection('meals');
    const favoritesMealCollection = ghorerRannaDB.collection('favorites');
    const reviewsCollection = ghorerRannaDB.collection('reviews');
    const ordersCollection = ghorerRannaDB.collection('orders');
    const paymentHistoryCollection = ghorerRannaDB.collection('paymentHistory');

    app.post('/getToken', async (req, res) => {
      const loggedUser = req.body;
      const token = jwt.sign(loggedUser, process.env.JWT_SECRET, {
        expiresIn: '12h',
      });
      res.send({ token: token });
    });

    // user related api

    app.get('/users', verifyJWTToken, async (req, res) => {
      const cursor = usersCollection.find();
      const users = await cursor.toArray();
      res.send(users);
    });

    app.get('/users/:email/info', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    app.get('/users/:email/role', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ role: user?.role || 'user' });
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      user.role = 'user';
      user.createdAt = new Date();
      user.status = 'active';
      const email = user.email;
      const userExists = await usersCollection.findOne({ email });

      if (userExists) {
        return res.send({ message: 'user exists' });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });


    app.patch('/users/:email/role', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const newRole = req.body.role;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          role: newRole,
        },
      };
      if (newRole === 'chef') {
        const chefId = generateChefId();
        let chefIdExists = await usersCollection.findOne({ chefId: chefId });
        while (chefIdExists) {
          const newChefId = generateChefId();
          chefIdExists = await usersCollection.findOne({ chefId: newChefId });
        }
        updateDoc.$set.chefId = chefId;
      }
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch('/users/:email/status', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const newStatus = req.body.status;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          status: newStatus,
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // chef request api
    app.get('/chef-requests', verifyJWTToken, async (req, res) => {
      const cursor = chefRequestsCollection.find();
      const requests = await cursor.toArray();
      res.send(requests);
    });

    app.get('/chef-requests/:email/check', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const request = await chefRequestsCollection.findOne(query);
      if (request) {
        return res.send({ requested: true });
      }
      res.send({ requested: false });
    });

    app.post('/chef-requests', verifyJWTToken, async (req, res) => {
      const request = req.body;
      request.requestStatus = 'pending';
      request.requestTime = new Date();
      const result = await chefRequestsCollection.insertOne(request);
      res.send(result);
    });

    app.patch('/chef-requests/:id/status', verifyJWTToken, async (req, res) => {
      const id = req.params.id;
      const newStatus = req.body.status;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          requestStatus: newStatus,
        },
      };
      const result = await chefRequestsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // admin request api
    app.get('/admin-requests', verifyJWTToken, async (req, res) => {
      const cursor = adminRequestsCollection.find();
      const requests = await cursor.toArray();
      res.send(requests);
    });

    app.get(
      '/admin-requests/:email/check',
      verifyJWTToken,
      async (req, res) => {
        const email = req.params.email;
        const query = { userEmail: email };
        const request = await adminRequestsCollection.findOne(query);
        if (request) {
          return res.send({ requested: true });
        }
        res.send({ requested: false });
      }
    );

    app.post('/admin-requests', verifyJWTToken, async (req, res) => {
      const request = req.body;
      request.requestStatus = 'pending';
      request.requestTime = new Date();
      const result = await adminRequestsCollection.insertOne(request);
      res.send(result);
    });

    app.patch('/admin-requests/:id/status', verifyJWTToken, async (req, res) => {
      const id = req.params.id;
      const newStatus = req.body.status;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          requestStatus: newStatus,
        },
      };
      const result = await adminRequestsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // meals related api
    app.get('/meals', async (req, res) => {
      const cursor = mealsCollection.find();
      const meals = await cursor.toArray();
      res.send(meals);
    });

    app.get('/latest-meals', async (req, res) => {
      const cursor = mealsCollection.find().sort({ createdAt: -1 }).limit(6);
      const meals = await cursor.toArray();
      res.send(meals);
    });

    app.get('/meals/:email', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      // console.log(email)
      const query = { userEmail: email };
      const cursor = mealsCollection.find(query);
      const meals = await cursor.toArray();
      res.send(meals);
    });

    app.get('/meals/:id/info', verifyJWTToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const meal = await mealsCollection.findOne(query);
      res.send(meal);
    });

    app.post('/meals', verifyJWTToken, async (req, res) => {
      const meal = req.body;
      meal.createdAt = new Date();
      const result = await mealsCollection.insertOne(meal);
      res.send(result);
    });

    app.patch('/meals/:id', verifyJWTToken, async (req, res) => {
      const id = req.params.id;
      const updatedMeal = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...updatedMeal,
        },
      };
      const result = await mealsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/meals/:id', verifyJWTToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await mealsCollection.deleteOne(filter);
      res.send(result);
    });

    // favorites related api
    app.get('/favorites/:email', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const cursor = favoritesMealCollection.find(query);
      const favorites = await cursor.toArray();
      res.send(favorites);
    });

    app.get('/favoritesCheck', verifyJWTToken, async (req, res) => {
      // console.log(req.query)
      const mealId = req.query.mealId;
      const email = req.query.email;
      const query = { mealId: mealId, userEmail: email };
      const favorite = await favoritesMealCollection.findOne(query);
      if (favorite) {
        return res.send({ favorite: true });
      }
      res.send({ favorite: false });
    });

    app.post('/favorites', verifyJWTToken, async (req, res) => {
      const favorite = req.body;
      favorite.addedAt = new Date();
      const result = await favoritesMealCollection.insertOne(favorite);
      res.send(result);
    });

    app.delete('/favorites/:id', verifyJWTToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await favoritesMealCollection.deleteOne(filter);
      res.send(result);
    });

    // reviews related api
    app.get('/reviews/meal/:mealId', async (req, res) => {
      const mealId = req.params.mealId;
      const query = { mealId: mealId };
      const cursor = reviewsCollection.find(query).sort({ createdAt: -1 });
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    app.get('/reviews/user/:email', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const cursor = reviewsCollection.find(query).sort({ createdAt: -1 });
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    app.post('/reviews', verifyJWTToken, async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);

      const mealId = review.mealId;
      const meal = await mealsCollection.findOne({ _id: new ObjectId(mealId) });
      const newReviewCount = (meal.reviewCount || 0) + 1;
      const newReviewSum = (meal.reviewSum || 0) + review.rating;
      const updateDoc = {
        $set: {
          reviewCount: newReviewCount,
          reviewSum: newReviewSum,
          rating: newReviewSum / newReviewCount,
        },
      };
      await mealsCollection.updateOne({ _id: new ObjectId(mealId) }, updateDoc);

      res.send(result);
    });

    app.patch('/reviews/:id', verifyJWTToken, async (req, res) => {
      const id = req.params.id;
      const updatedReview = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...updatedReview,
        },
      };
      const result = await reviewsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/reviews/:id', verifyJWTToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const review = await reviewsCollection.findOne(filter);

      const mealId = review.mealId;
      const meal = await mealsCollection.findOne({ _id: new ObjectId(mealId) });
      const newReviewCount = (meal.reviewCount || 1) - 1;
      const newReviewSum = (meal.reviewSum || 0) - review.rating;
      const updateDoc = {
        $set: {
          reviewCount: newReviewCount,
          reviewSum: newReviewSum,
          rating: newReviewCount ? newReviewSum / newReviewCount : 0,
        },
      };
      await mealsCollection.updateOne({ _id: new ObjectId(mealId) }, updateDoc);
      const result = await reviewsCollection.deleteOne(filter);
      res.send(result);
    });

    // orders related api
    app.get('/orders/:chefId', verifyJWTToken, async (req, res) => {
      const chefId = req.params.chefId;
      const query = { chefId: chefId };
      const cursor = ordersCollection.find(query).sort({ orderTime: -1 });
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.get('/orders/:email/user', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const cursor = ordersCollection.find(query).sort({ orderTime: -1 });
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.post('/orders', verifyJWTToken, async (req, res) => {
      const order = req.body;
      order.orderTime = new Date();
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });

    app.patch('/orders/:id/status', verifyJWTToken, async (req, res) => {
      const id = req.params.id;
      const newStatus = req.body.status;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          orderStatus: newStatus,
        },
      };
      const result = await ordersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // payment related api
    app.post('/create-payment-session', verifyJWTToken, async (req, res) => {
      const orderInfo = req.body;
      const amount = parseInt(orderInfo.price * 100);
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'USD',
              unit_amount: amount,
              product_data: {
                name: `Please pay for ${orderInfo.mealName}`,
              },
            },
            quantity: orderInfo.quantity,
          },
        ],
        mode: 'payment',
        metadata: {
          mealName: orderInfo.mealName,
          orderId: orderInfo._id,
        },
        customer_email: orderInfo.userEmail,
        success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}/dashboard/my-orders`,
      });
      res.send({ url: session.url });
    });

    app.patch('/payment-success', verifyJWTToken, async (req, res) => {
      const sessionId = req.query.session_id;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const transactionId = session.payment_intent;

      const query = { transactionId: transactionId };
      const paymentExists = await paymentHistoryCollection.findOne(query);
      if (paymentExists) {
        return res.send({ message: 'payment recorded' });
      }

      if (session.payment_status === 'paid') {
        const query = session.metadata.orderId;
        const updateDoc = {
          $set: {
            paymentStatus: 'paid',
          },
        };
        await ordersCollection.updateOne(
          { _id: new ObjectId(query) },
          updateDoc
        );

        const paymentRecord = {
          userEmail: session.customer_email,
          orderId: session.metadata.orderId,
          mealName: session.metadata.mealName,
          transactionId: transactionId,
          paymentTime: new Date(),
        };
        const result = await paymentHistoryCollection.insertOne(paymentRecord);
        res.send({
          success: true,
          modifyParcel: result,
          transactionId: session.payment_intent,
        });
      }
    });

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
