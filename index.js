const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;
const corsOptions = {
    origin: ['http://localhost:5173',
        'http://localhost:5174',
        'https://impact-connect-19304.web.app',
        'https://impact-connect-19304.firebaseapp.com'
    ],
    credentials: true,
    optionSuccessStatus: 200,
}
// middleware

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())


// verify jwt middleware

const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'unauthorize access' })
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                console.log(err)
                return res.status(401).send({ message: 'unauthorize access' })
            }
            console.log(decoded)
            next()
        })
    }

}







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



        // jwt token implement


        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "365d"
            })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            })
                .send({ success: true })
        })

        // clear cookie when user logout

        app.get('/logout', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 0,
            })
                .send({ success: true })
        })



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

            const token = req.cookies.token;
            console.log(token)
            const requestJob = req.body;
            const result = await requestVolunteerCollection.insertOne(requestJob)
            res.send(result)

        })

        // my requested job api data fetching

        app.get('/request-volunteer-job/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { loggedInUserEmail: (email) }
            const result = await requestVolunteerCollection.find(query).toArray()
            res.send(result)
        })


        // user request job post cancel api


        app.delete('/request-job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await requestVolunteerCollection.deleteOne(query)
            res.send(result)
        })

        // get all job posted by specific user 


        app.get('/my-job-posts/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            const query = { organizerEmail: (email) }
            const result = await jobPostCollection.find(query).toArray()
            res.send(result)
        })

        // delete job single job post

        app.delete('/my-job-post/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobPostCollection.deleteOne(query)
            res.send(result)
        })
        // update job single data

        app.put('/my-job-post/:id', async (req, res) => {
            const id = req.params.id;
            const jobData = req.body;
            console.log(jobData)
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    ...jobData
                }
            }
            const result = await jobPostCollection.updateOne(query, updateDoc, options)
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