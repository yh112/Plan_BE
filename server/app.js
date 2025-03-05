const express = require('express');
const cors = require('cors');
const routes = require('./routes/index.js'); // 📌 router.js 불러오기

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/api", routes);

const PORT = 4000;

app.listen(PORT, () => {
    console.log(`✅ 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
