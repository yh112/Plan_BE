const express = require('express');
const cors = require('cors');
const routes = require('./routes/index.js'); // 📌 router.js 불러오기
const {swaggerUi, specs} = require("./swagger/swagger");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/api", routes);
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.listen(process.env.PORT, process.env.SERVER, () => {
    console.log(`✅ Server running on http://${process.env.SERVER}:${process.env.PORT}`);
    console.log(`📌 Swagger Docs: http://${process.env.SERVER}:${process.env.PORT}/api-docs`);
  });