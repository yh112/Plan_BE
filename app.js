const express = require('express');
const cors = require('cors');
const routes = require('./routes/index.js'); // 📌 router.js 불러오기
const {swaggerUi, specs} = require("./swagger/swagger");

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/api", routes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

const PORT = 4000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📌 Swagger Docs: http://localhost:${PORT}/api-docs`);
  });