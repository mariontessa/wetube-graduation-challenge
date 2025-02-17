import express from "express";
import morgan from "morgan";

import session from "express-session";
import flash from "express-flash";
import MongoStore from "connect-mongo"; 
import rootRouter from "./routers/rootRouter";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import { localsMiddleware } from "./middleware";
import apiRouter from "./routers/apiRouter";


const app = express();
const logger = morgan("dev");

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,  
    cookie: {
      maxAge: 20000000
    },
    store: MongoStore.create({ mongoUrl: process.env.DB_URL })
  })
);

app.use(flash());
app.use(localsMiddleware);
app.use("/uploads", express.static("uploads"));
app.use("/assets", express.static("assets"));
app.use("/videos", videoRouter);
app.use("/users", userRouter);
app.use("/", rootRouter);
app.use("/api", apiRouter);

export default app;
