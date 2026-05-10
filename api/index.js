const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@single-product-1.0t8uz5o.mongodb.net/?retryWrites=true&w=majority&appName=single-product-1`;

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

    console.log("MongoDB Connected ✅");

    const productCollection = client
      .db("single-product")
      .collection("products");

    const cartDataCollection = client.db("single-product").collection("carts");

    // Home Route
    app.get("/", (req, res) => {
      res.send("Server Running 🚀");
    });

    // Get All Products
    app.get("/api/v1/products", async (req, res) => {
      try {
        const result = await productCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: "Failed to fetch products",
          error,
        });
      }
    });

    // Get All Cart Items
    app.get("/api/v1/cart", async (req, res) => {
      try {
        const result = await cartDataCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: "Failed to fetch cart data",
          error,
        });
      }
    });

    // Get Single Product
    app.get("/api/v1/cart/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const filterId = {
          _id: new ObjectId(id),
        };

        const result = await productCollection.findOne(filterId);

        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: "Failed to fetch product",
          error,
        });
      }
    });

    // Add To Cart
    app.put("/api/v1/cart/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const cartData = req.body;

        const { quantity } = cartData;

        const objectId = new ObjectId(id);

        const existingProduct = await cartDataCollection.findOne({
          _id: objectId,
        });

        if (existingProduct) {
          await cartDataCollection.updateOne(
            { _id: objectId },
            {
              $inc: {
                quantity: parseInt(quantity),
              },
            },
          );

          return res.status(200).send({
            message: "Product quantity updated",
          });
        }

        cartData._id = objectId;

        await cartDataCollection.insertOne(cartData);

        res.status(200).send({
          message: "Product added to cart",
        });
      } catch (error) {
        res.status(500).send({
          message: "Error updating cart",
          error,
        });
      }
    });

    // Delete Cart Item
    app.delete("/api/v1/cart/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const filterId = {
          _id: new ObjectId(id),
        };

        await cartDataCollection.deleteOne(filterId);

        res.status(200).send({
          message: "Cart deleted successfully",
        });
      } catch (error) {
        res.status(500).send({
          message: "Error deleting cart item",
          error,
        });
      }
    });

    // Update Quantity
    app.put("/api/v1/cart/quantity/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const { quantity } = req.body;

        const objectId = new ObjectId(id);

        const existingProduct = await cartDataCollection.findOne({
          _id: objectId,
        });

        if (!existingProduct) {
          return res.status(404).send({
            message: "Product not found in cart",
          });
        }

        const newQuantity = existingProduct.quantity + quantity;

        if (newQuantity > 0) {
          await cartDataCollection.updateOne(
            { _id: objectId },
            {
              $set: {
                quantity: newQuantity,
              },
            },
          );

          return res.status(200).send({
            message: "Product quantity updated",
            newQuantity,
          });
        }

        await cartDataCollection.deleteOne({
          _id: objectId,
        });

        res.status(200).send({
          message: "Product removed from cart",
        });
      } catch (error) {
        res.status(500).send({
          message: "Error updating quantity",
          error,
        });
      }
    });

    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB Ping Success ✅");
  } catch (error) {
    console.log(error);
  }
}

run();

module.exports = app;
