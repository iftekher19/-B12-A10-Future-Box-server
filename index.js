require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",    
      "http://localhost:3000",   
      "https://plateshare-6602a.web.app",
      "https://plateshare-6602a.firebaseapp.com" 
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@plateshare.v0bnf8w.mongodb.net/?retryWrites=true&w=majority`;

let cachedClient = null;
let cachedDb = null;

async function connectDB() {
  if (cachedDb && cachedClient) return { client: cachedClient, db: cachedDb };

  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  await client.connect();

  const db = client.db("plateShareDB");
  cachedClient = client;
  cachedDb = db;

  console.log(" MongoDB connected (cached)");
  return { client, db };
}

// Routes

// test route
app.get("/", (req, res) => {
  res.send("PlateShare server is running...");
});

// Create Food Item
app.post("/foods", async (req, res) => {
  try {
    const { db } = await connectDB();
    const foods = db.collection("foods");

    const newFood = req.body;
    newFood.food_status = "Available";
    newFood.createdAt = new Date();

    const result = await foods.insertOne(newFood);
    res.status(201).send({ success: true, message: "Food added successfully", result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Failed to add food" });
  }
});

// Get All Available Foods
app.get("/foods", async (req, res) => {
  try {
    const { db } = await connectDB();
    const foods = db.collection("foods");
    const filter = { food_status: "Available" };
    if (req.query.email) filter["donator.email"] = req.query.email;

    const result = await foods.find(filter).toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch foods" });
  }
});

// Get Food by ID
app.get("/foods/:id", async (req, res) => {
  try {
    const { db } = await connectDB();
    const foods = db.collection("foods");

    const food = await foods.findOne({ _id: new ObjectId(req.params.id) });
    if (!food) return res.status(404).send({ message: "Food not found" });
    res.send(food);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch food" });
  }
});

// Update Food Item
app.patch("/foods/:id", async (req, res) => {
  try {
    const { db } = await connectDB();
    const foods = db.collection("foods");

    const result = await foods.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    res.send({ success: true, message: "Food updated", result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Update failed" });
  }
});

// Delete Food Item
app.delete("/foods/:id", async (req, res) => {
  try {
    const { db } = await connectDB();
    const foods = db.collection("foods");

    const result = await foods.deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount)
      return res.status(404).send({ success: false, message: "Food not found" });

    res.send({ success: true, message: "Food deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Delete failed" });
  }
});

//submit food request
app.post("/requests", async (req, res) => {
  try {
    const { db } = await connectDB();
    const requests = db.collection("foodRequests");

    const newReq = {
      ...req.body,
      status: "pending",
      createdAt: new Date(),
    };
    const result = await requests.insertOne(newReq);
    res.status(201).send({ success: true, message: "Request submitted", result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Failed to submit food request" });
  }
});

// get requests for a specific food item
app.get("/requests/:foodId", async (req, res) => {
  try {
    const { db } = await connectDB();
    const requests = db.collection("foodRequests");
    const result = await requests.find({ foodId: req.params.foodId }).toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch requests" });
  }
});

//accept/reject food request
app.patch("/requests/:id", async (req, res) => {
  try {
    const { db } = await connectDB();
    const requests = db.collection("foodRequests");
    const foods = db.collection("foods");

    const { status, foodId } = req.body;
    const updateReq = await requests.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status } }
    );

    if (status === "accepted" && foodId) {
      await foods.updateOne(
        { _id: new ObjectId(foodId) },
        { $set: { food_status: "donated" } }
      );
    }

    res.send({ success: true, message: "Request status updated", updateReq });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Failed to update request" });
  }
});

// get all requests made by a user
app.get("/my-requests", async (req, res) => {
  try {
    const { db } = await connectDB();
    const requests = db.collection("foodRequests");

    const { email } = req.query;
    if (!email) return res.status(400).send({ message: "Email query required" });

    const result = await requests.find({ userEmail: email }).toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch user requests" });
  }
});

// Start the server vercel or local
module.exports = app;