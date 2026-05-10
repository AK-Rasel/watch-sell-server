const express = require("express");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const clientPromise = require("../db"); // IMPORTANT path fix

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------- DB HELPER ---------------- */
async function getDB() {
  const client = await clientPromise;
  return client.db("single-product");
}

/* ---------------- ROUTES ---------------- */

// Home
app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

// Get all products
app.get("/api/v1/products", async (req, res) => {
  try {
    const db = await getDB();
    const products = await db.collection("products").find().toArray();
    res.send(products);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch products", err });
  }
});

// Get all cart items
app.get("/api/v1/cart", async (req, res) => {
  try {
    const db = await getDB();
    const cart = await db.collection("carts").find().toArray();
    res.send(cart);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch cart", err });
  }
});

// Get single product
app.get("/api/v1/product/:id", async (req, res) => {
  try {
    const db = await getDB();

    const product = await db.collection("products").findOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(product);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch product", err });
  }
});

// Add / Update cart
app.put("/api/v1/cart/:id", async (req, res) => {
  try {
    const db = await getDB();
    const id = new ObjectId(req.params.id);
    const { quantity } = req.body;

    const cartCollection = db.collection("carts");

    const existing = await cartCollection.findOne({ _id: id });

    if (existing) {
      await cartCollection.updateOne(
        { _id: id },
        { $inc: { quantity: parseInt(quantity) } },
      );

      return res.send({ message: "Cart updated" });
    }

    await cartCollection.insertOne({
      _id: id,
      ...req.body,
    });

    res.send({ message: "Added to cart" });
  } catch (err) {
    res.status(500).send({ message: "Cart error", err });
  }
});

// Update quantity
app.put("/api/v1/cart/quantity/:id", async (req, res) => {
  try {
    const db = await getDB();
    const id = new ObjectId(req.params.id);
    const { quantity } = req.body;

    const cartCollection = db.collection("carts");

    const existing = await cartCollection.findOne({ _id: id });

    if (!existing) {
      return res.status(404).send({ message: "Not found" });
    }

    const newQuantity = existing.quantity + quantity;

    if (newQuantity > 0) {
      await cartCollection.updateOne(
        { _id: id },
        { $set: { quantity: newQuantity } },
      );

      return res.send({ message: "Updated", newQuantity });
    }

    await cartCollection.deleteOne({ _id: id });

    res.send({ message: "Removed from cart" });
  } catch (err) {
    res.status(500).send({ message: "Error updating quantity", err });
  }
});

// Delete cart item
app.delete("/api/v1/cart/:id", async (req, res) => {
  try {
    const db = await getDB();

    await db.collection("carts").deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.send({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: "Delete error", err });
  }
});

module.exports = app;
