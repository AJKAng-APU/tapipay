# TapiPay Quantum-Resistant Server (PQC)

### Features
- Simulated ML-DSA signing
- PQC token handling
- Express API with protected route

### Run It
```bash
npm install express body-parser
npx ts-node index.ts
```

Visit: http://localhost:3000/login  → use POST with { "username": "alice" }
Use the returned token in Authorization header to access /secure/data

✅ Replace pqc.ts with actual liboqs-based module when moving to production.
✅ Consider ML-DSA (FIPS 204) bindings for real cryptographic strength.
