const express = require("express");
const bodyParser = require("body-parser");
const upload = require("./models/upload");
const { port } = require("./config");
const path = require("path");
const flash = require("express-flash");
const { fetch } = require("./routes/index.js");
const mongoose = require("mongoose");
const ejs = require("ejs");
const app = express();
mongoose.connect(
  "mongodb+srv://screepy:64478912@cluster0.enpgcpw.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
app.set("view engine", "ejs");
app.use(express.static(`${__dirname}/public`));
app.use(flash());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  require("express-session")({
    secret:
      "#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
    resave: false,
    saveUninitialized: false,
  })
);
const dataDir = path.resolve(`${process.cwd()}`);
const templateDir = path.resolve(`${dataDir}${path.sep}views`);
const renderTemplate = (res, req, template, data = {}) => {
  const baseData = {
    path: req.path,
    ejs,
  };
  res.render(
    path.resolve(`${templateDir}${path.sep}${template}`),
    Object.assign(baseData, data),
  );
};

app.get("/", async function (req, res) {
  await fetch("688660450568699986", "933943929643098142");
  const page = req.query.page || 1;
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

const potter = port || 3000;
app.listen(potter, () => {
  console.log(`server started on port ${port}`);
});