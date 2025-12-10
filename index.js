const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
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

    app.post('/getToken', async (req, res) => {
      const loggedUser = req.body;
      const token = jwt.sign(loggedUser, process.env.JWT_SECRET, {
        expiresIn: '12h',
      });
      res.send({ token: token });
    });

    // user related api

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


    // chef request api
    app.get('/chef-requests/:email/check', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail:email };
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

    // admin request api
    app.get('/admin-requests/:email/check', verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail:email };
      const request = await adminRequestsCollection.findOne(query);
      if (request) {
        return res.send({ requested: true });
      }
      res.send({ requested: false });
    });

    app.post('/admin-requests', verifyJWTToken, async (req, res) => {
      const request = req.body;
      request.requestStatus = 'pending';
      request.requestTime = new Date();
      const result = await adminRequestsCollection.insertOne(request);
      res.send(result);
    });

    // meals related api
    app.get('/meals', async (req, res) => {
      const cursor = mealsCollection.find();
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
