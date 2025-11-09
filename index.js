require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@plateshare.v0bnf8w.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("PlateShare server is running...");
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB connected successfully!");

    const db = client.db("plateShareDB");
    const foodsCollection = db.collection("foods");

    // Create Food DATA
    app.post("/foods", async (req, res) => {
      try {
        const newFood = req.body;
        newFood.food_status = "Available";
        newFood.createdAt = new Date();
        const result = await foodsCollection.insertOne(newFood);
        res.status(201).send({
          success: true,
          message: "Food added successfully",
          result,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Failed to add food" });
      }
    });

    

    // ------------------------------ PING TEST ------------------------------
    await db.command({ ping: 1 });
    console.log(" Pinged the database - connection confirmed!");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}

run().catch(console.error);

// ---------- server start ----------
app.listen(port, () =>
  console.log(`🚀 PlateShare server running on port ${port}`)
);
