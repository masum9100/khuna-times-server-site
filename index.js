const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5001
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rdnshyp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

const newsCollection = client.db('khulnaToday').collection('news')
const newArticleCollection = client.db('khulnaToday').collection('newarticle')


app.get('/news', async(req, res)=>{
    const result = await newsCollection.find().toArray()
    res.send(result)
})

app.get('/news/:id', async(req, res)=>{
    const id  = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await newsCollection.findOne(query)
    res.send(result)
})

// new article 

app.get('/newarticle', async(req, res)=>{
    const cursor = newArticleCollection.find()
    const result = await cursor.toArray()
    res.send(result)
})

app.post('/newarticle', async(req, res) =>{
    const newArticle = req.body
    console.log(newArticle)
    const result = await newArticleCollection.insertOne(newArticle)
    res.send(result)
})

app.delete('/newarticle/:id', async(req, res) =>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await newArticleCollection.deleteOne(query)
    res.send(result)
})







    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Khulna Times server is running')
})

app.listen(port, () => {
    console.log(`Khulna Times server is running on port ${port}`)
})