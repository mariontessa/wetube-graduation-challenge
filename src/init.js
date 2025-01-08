import "regenerator-runtime"
import "dotenv/config";
import "./db";
import "./models/video";
import "./models/user";
import"./models/comment";
import app from "./server";

const PORT = 4000;

const handleListening = () =>
  console.log(`✅ server listening on port http://localhost:${PORT}`);

app.listen(PORT, handleListening);
