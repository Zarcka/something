import express, { Response, Request } from "express";
import bodyParser from "body-parser";
import upload from "./models/upload";
import config from "./config";
import path from "path";
import flash from "express-flash";
import { get } from "./routes/index";
import mongoose from "mongoose";
import ejs from "ejs";

const app = express();

mongoose.connect(config.dbToken);

app.set("view engine", "ejs");
app.use(express.static(`${__dirname}/public`));
app.use(flash());
app.use(express.json());
app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(
   require("express-session")({
      secret: "#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
      resave: false,
      saveUninitialized: false,
   })
);

const dataDir = path.resolve(`${process.cwd()}`);
const templateDir = path.resolve(`${dataDir}${path.sep}views`);
const renderTemplate = (res: Response, req: Request, template: any, data = {}) => {
   const baseData = {
      path: req.path,
      ejs,
   };
   res.render(
      path.resolve(`${templateDir}${path.sep}${template}`),
      Object.assign(baseData, data),
   );
};

app.get("/", async (req: Request, res: Response) => {
   await get("688660450568699986", "933943929643098142");
   const page: any = req.query.page || 1;
   const perPage = 5;
   const skip = (page - 1) * perPage;
   const count = await upload.countDocuments();
   const totalPages = Math.ceil(count / perPage);
   const find = await upload.find({}).skip(skip).limit(perPage);
   const attachments = find.map((item) => {
      return item;
   });
   renderTemplate(res, req, "index.ejs", {
      attachments,
      page,
      totalPages,
   });
});

app.get("/screepy", (req: Request, res: Response) => {
   res.sendFile(`${__dirname}/views/screepy/`);
});

app.get("/zarcka", (req: Request, res: Response) => {
   res.sendFile(`${__dirname}/views/zarcka/`);
});

const potter = config.port || 3000;
app.listen(potter, () => {
   console.log(`server started on port ${potter}`);
});