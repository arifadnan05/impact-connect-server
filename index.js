const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;
const corsOptions = {
    origin: ['http://localhost:5173',
        'http://localhost:5174',
        'https://impact-connect-19304.firebaseapp.com',
        'https://impact-connect-19304.web.app'],
    credentials: true,
    optionSuccessStatus: 200,
}
// middleware

app.use(cors(corsOptions))
app.use(express.json())








const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8lcgwxk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        // collection

        const jobPostCollection = client.db('impactConnect').collection('jobPost');
        const requestVolunteerCollection = client.db('impactConnect').collection('request-volunteer-job');


        // add job post
        app.post('/add-job-post', async (req, res) => {
            const job = req.body;
            const result = await jobPostCollection.insertOne(job)
            res.send(result)

        })

        app.get('/all-job-post', async (req, res) => {
            const result = await jobPostCollection.find().toArray();
            res.send(result)
        })

        // shorting api upcoming deadline
        app.get('/add-job-post', async (req, res) => {
            const result = await jobPostCollection.find().sort({ 'deadline': -1 }).toArray();
            res.send(result)
        })

        app.get('/add-job-post/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobPostCollection.findOne(query)
            res.send(result)
        })

        // request volunteer job to adding database

        app.post('/request-volunteer-job', async (req, res) => {
            const requestJob = req.body;
            const result = await requestVolunteerCollection.insertOne(requestJob)
            res.send(result)

        })

        // my requested job api 

        app.get('/request-volunteer-job/:email', async (req, res) => {
            const email = req.params.email;
            const query = { loggedInUserEmail: (email) }
            const result = await requestVolunteerCollection.find(query).toArray()
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);









app.get('/', (req, res) => {

    res.send('Impact connect Server was running...')
})
app.listen(port, () => {
    console.log(`Impact connect ser was running on port ${port}`)
})