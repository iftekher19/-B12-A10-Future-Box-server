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

    // Get all available foods
    app.get("/foods", async (req, res) => {
      try {
        const filter = { food_status: "Available" };
        if (req.query.email) {
          filter["donator.email"] = req.query.email;
        }
        const result = await foodsCollection.find(filter).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch foods" });
      }
    });

    // Update a food (Manage My Foods)
    app.patch("/foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedInfo = req.body;
        const updateDoc = { $set: updatedInfo };
        const result = await foodsCollection.updateOne(
          { _id: new ObjectId(id) },
          updateDoc
        );
        res.send({ success: true, message: "Food updated", result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Update failed" });
      }
    });

    // Get one food by id (Food Details)
    app.get("/foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const food = await foodsCollection.findOne({ _id: new ObjectId(id) });
        if (!food) return res.status(404).send({ message: "Food not found" });
        res.send(food);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch food" });
      }
    });

    // Delete a food
    app.delete("/foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await foodsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0)
          return res
            .status(404)
            .send({ success: false, message: "Food not found" });
        res.send({ success: true, message: "Food deleted" });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Delete failed" });
      }
    });

    //Ping the database
    await db.command({ ping: 1 });
    console.log(" Pinged the database - connection confirmed!");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
}

run().catch(console.error);

// Start the server
app.listen(port, () =>
  console.log(`PlateShare server running on port ${port}`)
);
