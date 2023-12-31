const express = require('express')
const jwt = require('jsonwebtoken');
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5001
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const query = require('express/lib/middleware/query')


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
        // await client.connect();

        const newsCollection = client.db('khulnaToday').collection('news')
        const newArticleCollection = client.db('khulnaToday').collection('newarticle')
        const userCollection = client.db('khulnaToday').collection('users')


        // jwt part 

        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            res.send({ token })
        })

        // middleware 

        const verifyToken = (req, res, next) => {
            console.log('inside verify token', req.headers.authorization)
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded
                next()
            })

        }
        // verify admin with token 
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const isAdmin = user?.role === 'admin'
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }



        // User Collection 

        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })

            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            let admin = false
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin })
        })

        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already exist', insertedId: null })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        // News collection 


        app.get('/news', async (req, res) => {
            const result = await newsCollection.find().toArray()
            res.send(result)
        })

        app.get('/news/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await newsCollection.findOne(query)
            res.send(result)
        })

        // new article 

        app.get('/newarticle', async (req, res) => {

            let query = {}
            if (req.query?.user_email) {
                query = { user_email: req.query.user_email }
            }
            const result = await newArticleCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/newarticle/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await newArticleCollection.findOne(query)
            res.send(result)
        })

        app.post('/newarticle', async (req, res) => {
            const newArticle = req.body
            const result = await newArticleCollection.insertOne(newArticle)
            res.send(result)
        })

        app.put('/newarticle/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateArticle = req.body
            const article = {
                $set: {

                    newsTitle: updateArticle.newsTitle,
                    short_description: updateArticle.short_description,
                    long_description: updateArticle.long_description,
                    photo_url1: updateArticle.photo_url1,
                    photo_url2: updateArticle.photo_url2,
                    user_email: updateArticle.user_email,
                    tag: updateArticle.tag,

                }
            }
            const result = await newArticleCollection.updateOne(filter, article, options)
            res.send(result)
        })

        app.delete('/newarticle/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await newArticleCollection.deleteOne(query)
            res.send(result)
        })








        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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