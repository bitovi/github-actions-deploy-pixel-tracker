import dotenv from 'dotenv';
import express, { json } from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { exit } from 'process';
import pg from 'pg';
const { Client } = pg;


// dirname shim
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pixelPath = path.resolve(__dirname, '1x1.png');

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
const apiSecret = process.env.API_SECRET;

// parse application/json
app.use(bodyParser.json());


// middleware to log all requests in json format
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const method = req.method;
    const url = req.url;
    const timestamp = new Date().toISOString();
    // referer
    const referer = getRefererFromRequest(req);
    const log = JSON.stringify({ timestamp, ip, userAgent, method, url, referer });
    console.log("DEBUGGING (headers):")
    console.log(req.headers);
    console.log("DEBUGGING (body):")
    console.log(req.body);
    console.log(log);
    next();
});


let client;
// Set up PostgreSQL connection
const client_get = async () => {
    if (client) {
        return client;
    }

    try {
        client = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
        });
        client.connect();
        console.log('Connected to PostgreSQL database');
        return client;
    } catch (err) {
        console.log("Error connecting to PostgreSQL database")
        console.error(err);
        exit(1);
    }
}

const client_close = async () => {
    if (client) {
        await client.end();
        client = null;
    }
}

const checkApiSecret = (req, res) => {
    switch (req.method) {
        case 'POST':
            if (req.body['api-secret'] !== apiSecret) {
                res.status(401).send('Unauthorized');
                return false;
            }
            break;
        case 'GET':
            if (req.query['api-secret'] !== apiSecret) {
                res.status(401).send('Unauthorized');
                return false;
            }
            break;
        default:
            res.status(401).send('Unauthorized');
            return false;
    }
    return true
}

const getRefererFromRequest = (req) => {
    let referer = req.headers['referer'] || req.headers['referrer'];
    if(!referer) {
        referer = req.get('Referrer');
    }

    return referer;
}

// serve empty 200 for / endpoint
app.get('/', (req, res) => {
    res.status(200).send(`Pixel Tracker App (Version ${process.env.npm_package_version})`);
});

// serve the index.html file from /test
app.use('/test', express.static('index.html'));

// serve the index.js file as a static file from root
app.use(express.static('index.js'));

// Serve 1x1 Pixel and Log Request
app.get('/pixel/:id', async (req, res) => {
     
    const id = req.params.id;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referer = getRefererFromRequest(req);

    const client = await client_get();
    // Log the request
    try {
        await client.query('BEGIN');
        const queryText = 'INSERT INTO requests(tracker_id, ip_address, user_agent, referer, timestamp) VALUES($1, $2, $3, $4, NOW())';
        await client.query(queryText, [id, ip, userAgent, referer]);
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        console.log("finally, releasing client")
        await client_close();
    }


    // Send a 1x1 pixel image
    const pixelPath = path.resolve(__dirname, '1x1.png');
    res.sendFile(pixelPath);

    console.log(`Pixel ${id} served.`);
});

// Endpoint to List All Pixels and Visit Counts
app.get('/stats', async (req, res) => {
    if(!checkApiSecret(req,res)) {
        console.log("Unauthorized");
        return;
    }
    const client = await client_get();
    try {
        const result = await client.query('SELECT id, tracker_id, ip_address, user_agent, referer FROM requests GROUP BY id, tracker_id');
        const json_response = {
            count: result.rowCount,
            results: result.rows
        }
        res.json(json_response);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error 2');
    } finally {
        console.log("finally, releasing client")
        await client_close();
    }

});

// /metrics endpoint to output prometheus metrics of the visit counts
// it should output a flat text file in openmetrics format
app.get('/metrics', async (req, res) => {
    const client = await client_get();

    try {
        // query to get all the visit counts per tracker_id
        const result = await client.query('SELECT tracker_id, referer, COUNT(*) FROM requests GROUP BY tracker_id, referer');
        const metrics = [];
        result.rows.forEach(row => {
            const metric = `pixel_tracker_visits{tracker_id="${row.tracker_id}",referer="${row.referer}"} ${row.count}`;
            metrics.push(metric);
        });
        const response = metrics.join('\n');
        res.set('Content-Type', 'text/plain');
        res.send(response);

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error 2');
    } finally {
        console.log("finally, releasing client")
        await client_close();
    }
});

// endpoint to list a single pixel and visit count
app.get('/stats/:trackerId', async (req, res) => {
    if(!checkApiSecret(req,res)) {
        console.log("Unauthorized");
        return;
    }
    const trackerId = req.params.trackerId;
    const client = await client_get();
    let result;
    try {
        result = await client.query('SELECT id, tracker_id, ip_address, user_agent, referer FROM requests WHERE tracker_id = $1 GROUP BY id, tracker_id', [trackerId]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error 2');
        return;
    } finally {
        console.log("finally, releasing client")
        await client_close();
    }

    if (result && result.rowCount === 0) {
        messagge = `Tracker with ID: ${trackerId} not found.`
        const json_response = {
            message: message,
            status: 404
        }
        res.status(404).json(json_response);
    } else {
        const json_response = {
            trackerId: trackerId,
            count: result.rowCount,
            result: result.rows
        }
        res.json(json_response);
    }
});

// Generate a New Tracker ID
app.post('/new-tracker', async (req, res) => {
    console.log("req.body", req.body)
    console.log("req.body.api-secret", req.body['api-secret'])
    if(!checkApiSecret(req,res)) {
        // check the body for the api-secret
        console.log("Unauthorized");
        return;
    }
    const newId = nanoid();
    const client = await client_get();

    try {
        const result = await client.query('INSERT INTO trackers(id) VALUES($1)', [newId]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error 2');
        client.end();
        pool_release();
        return;
    } finally {
        console.log("finally, releasing client")
        await client_close();
    }
    // send back json object with newId
    const json_response = {
        id: newId
    }
    res.json(json_response);
});

// delete a single tracker
app.post('/delete-tracker', async (req, res) => {
    if(!checkApiSecret(req,res)) {
        console.log("Unauthorized");
        return;
    }
    const id = req.params.trackerId;
    const client = await client_get();

    try {
        const result = await client.query('DELETE FROM trackers WHERE tracker_id = $1', [id]);
        if (result.rowCount === 0) {
            messagge = `Tracker with ID: ${trackerId} not found.`
            const json_response = {
                message: message,
                status: 404
            }
            res.status(404).json(json_response);
        } else {
            res.send(`Tracker with ID: ${trackerId} deleted.`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error 2');
    } finally {
        console.log("finally, releasing client")
        await client_close();
    }
});

app.listen(port, () => {
    console.log(`Pixel tracker app listening at http://localhost:${port}`);
});