const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const UPLOADS_FOLDER_PATH = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_FOLDER_PATH)) {
  fs.mkdirSync(UPLOADS_FOLDER_PATH);
}

const app = express();
app.use(express.json());
app.use(cors())
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const PORT = 8081;

app.listen(PORT, () => {
  console.log(`listening ${PORT}`);
});

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mir_pohydenia",
  dateStrings: true,
});

connection.connect((error) => {
  if (error) {
    console.log(error);
  } else console.log("Подключение успешно!");
});

app.get("/", (req, res) => {
  console.log("Ok");
  res.send("Ok");
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed!"));
  },
});

app.post("/api_post/articles", upload.single("image"), (req, res) => {
  const title = req.body.title;
  const author = req.body.author;
  const type = req.body.type;
  const text = req.body.text;
  const image = req.file ? req.file.path.replace(/\\/g, "/") : null;

  const request = connection.query(
    "INSERT INTO `articles`(`image_articles`,`author_articles`, `name_articles`, `text_articles`,`created_articles`, `type_articles`) VALUES (?,?,?,?,NOW(),?)",
    [image, author, title, text, type],
    (err, data) => {
      if (err) {
        return console.log(err);
      }

      if(data.affectedRows > 0){
        res.send(JSON.stringify({
          message: "Новая статья успешно добавлена!",
          status: 200,
        }))
      }
    }
  );
});

app.post("/api_post/articles/id", (req, res) => {
  const id = req.body.id_article;

  const request = connection.query(
    "DELETE FROM `articles` WHERE id__articles = ?", [id], (err, data) => {
      if (err) {
        return console.log(err);
      }

      if(data.affectedRows > 0){
        res.send(JSON.stringify({
          message: "Статья успешно удалена!",
          status: 200,
        }))
      }
    }
  );
})

app.post("/api_post/users", (req, res) => {
  try {
    const login = req.body.login;
    const password = req.body.password;

    const request = connection.query(
      "SELECT `name_user`, `password_user` FROM `users` WHERE name_user = ? AND password_user = ?",
      [login, password],
      (err, data) => {
        if (err) {
          return console.log(err.message);
        }

        if (data.length > 0) {
          console.log("Пользователь найден в БД");
          res.send(
            JSON.stringify({
              message: "Успешная авторизация",
              status: 200,
            })
          );
        } else {
          console.log("Пользователь не найден в БД");
          res.send(
            JSON.stringify({
              message: "Пользователь не найден",
              status: 404,
            })
          );
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
});

app.get("/api_get/articles", (req, res) => {
  const request = "SELECT * FROM `articles`";
  connection.query(request, (err, data) => {
    if (err) {
      console.log(err);
      return err;
    }

    res.send(data);
  });
});
