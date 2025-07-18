import express from 'express';
import bodyParser from 'body-parser';
import { pqcSign, pqcVerify, pqcGenerateKeyPair } from './pqc';

const app = express();
app.use(bodyParser.json());

const { privateKey: pqcPrivateKey, publicKey: pqcPublicKey } = pqcGenerateKeyPair();

app.post('/login', (req, res) => {
  const payload = {
    username: req.body.username,
    timestamp: Date.now()
  };
  const token = pqcSign(JSON.stringify(payload), pqcPrivateKey);
  res.json({ token });
});

app.use('/secure', (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  const verified = pqcVerify(token.toString(), pqcPublicKey);
  if (!verified) return res.status(403).json({ error: 'Invalid token' });
  next();
});

app.get('/secure/data', (req, res) => {
  res.json({ message: 'Access granted to quantum-safe route.' });
});

app.listen(3000, () => console.log('TapiPay PQC Server running on http://localhost:3000'));
