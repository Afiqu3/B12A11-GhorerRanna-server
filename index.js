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

    app.post('/getToken', async (req, res) => {
      const loggedUser = req.body;
      const token = jwt.sign(loggedUser, process.env.JWT_SECRET, {
        expiresIn: '12h',
      });
      res.send({ token: token });
    });

    // app.get('/hello', verifyJWTToken, async (req, res) => {
    //   res.send({ message: 'Hello from the other side' });
    // });

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
