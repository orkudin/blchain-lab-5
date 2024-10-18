// backend/index.js
const express = require('express');
const Web3 = require('web3').default; // Import the default export for newer versions
const path = require('path');
const SimpleStorageABI = require(path.resolve(__dirname, '../blockchain-app/build/contracts/SimpleStorage.json')).abi;
const setupSwagger = require('./swagger'); // Import Swagger setup

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Web3 instance and connect to Ganache
const web3 = new Web3('http://127.0.0.1:8545');

// Update with the deployed contract address from Ganache
const contractAddress = '0xfbF782C4dabedB54367C602FbC693cE7CB4b91a6';
const simpleStorage = new web3.eth.Contract(SimpleStorageABI, contractAddress);

app.use(express.json());

// Set up Swagger (Make sure this is set up before the routes are defined)
setupSwagger(app);

/**
 * @swagger
 * /set:
 *   post:
 *     summary: Set a value in the smart contract
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: integer
 *                 example: 42
 *     responses:
 *       200:
 *         description: Value set successfully
 *       500:
 *         description: Internal server error
 */


app.post('/set', async (req, res) => {
    const { value } = req.body;
    const accounts = await web3.eth.getAccounts();

    try {
        await simpleStorage.methods.set(value).send({
            from: accounts[0],
            gasPrice: await web3.eth.getGasPrice() // Указать цену на газ в явном виде
        });
        res.status(200).send('Value set successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

/**
 * @swagger
 * /get:
 *   get:
 *     summary: Get the current value from the smart contract
 *     responses:
 *       200:
 *         description: Returns the current value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 value:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
app.get('/get', async (req, res) => {
  try {
      const value = await simpleStorage.methods.get().call();
      res.status(200).send({ value: value.toString() }); // Convert BigInt to string
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
