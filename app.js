const express = require('express');
const cors = require('cors');
const routes = require('./routes/index.js');
const { swaggerUi, specs } = require("./swagger/swagger");
const cookieParser = require("cookie-parser");

require('dotenv').config(); // env 로딩

const app = express();

// ✅ 여러 origin 허용
const allowedOrigins = [
  `http://${process.env.SERVER}`,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ Not allowed by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use("/api", routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.listen(process.env.PORT, process.env.SERVER, () => {
  console.log(`✅ Server running on http://${process.env.SERVER}:${process.env.PORT}`);
  console.log(`📌 Swagger Docs: http://${process.env.SERVER}:${process.env.PORT}/api-docs`);
});
