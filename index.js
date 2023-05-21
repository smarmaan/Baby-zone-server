const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2qbsssi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toysInfoCollections = client.db("babyZone").collection("toysInfo");

    const indexKeys = { name: 1, brand: 1 };

    const indexOptions = { name: "brandName" };

    const result = await toysInfoCollections.createIndex(
      indexKeys,
      indexOptions
    );

    app.get("/search-by/:text", async (req, res) => {
      const searchBy = req.params.text;

      const result = await toysInfoCollections
        .find({
          $or: [
            {
              name: { $regex: searchBy, $options: "i" },
            },
            {
              brand: { $regex: searchBy, $options: "i" },
            },
          ],
        })
        .toArray();

      res.send(result);
    });

    app.get("/all-toys", async (req, res) => {
      const result = await toysInfoCollections.find().limit(20).toArray();
      res.send(result);
    });

    app.post("/all-toys", async (req, res) => {
      const toyDetails = req.body;
      console.log(toyDetails);
      const result = await toysInfoCollections.insertOne(toyDetails);
      res.send(result);
    });

    app.get("/my-toys", async (req, res) => {
      console.log(req.query.email);
      let query = {};

      if (req.query?.email) {
        query = { seller_email: req.query.email };
      }

      const sortOptions = {};
      if (req.query?.sort === "asc") {
        sortOptions.price = 1; // Sort in ascending order
      } else if (req.query?.sort === "dsc") {
        sortOptions.price = -1; // Sort in descending order
      }

      const result = await toysInfoCollections
        .find(query)
        .sort(sortOptions)
        .toArray();
      res.send(result);
    });

    app.delete("/my-toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysInfoCollections.deleteOne(query);
      res.send(result);
    });

    app.patch("/my-toys/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const updatedToyInfo = req.body;

      console.log(updatedToyInfo);

      const updateToy = {
        $set: {
          name: updatedToyInfo.name,
          seller_name: updatedToyInfo.seller_name,
          seller_email: updatedToyInfo.seller_email,
          price: updatedToyInfo.price,
          available_quantity: updatedToyInfo.available_quantity,
          picture: updatedToyInfo.picture,
          brand: updatedToyInfo.brand,
          rating: updatedToyInfo.rating,
          description: updatedToyInfo.description,
        },
      };

      const result = await toysInfoCollections.updateOne(query, updateToy);
      res.send(result);
    });

    app.get("/toy-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysInfoCollections.findOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(
    " Baby Zone api site is running in this site... explore this site via different link to get api data..."
  );
});

app.listen(port, () => {
  console.log(`Baby Zone api site is running on this port no ${port}`);
});
