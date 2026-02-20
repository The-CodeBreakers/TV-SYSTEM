const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const ADMIN_PASSWORD = "12345";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

/* LOGIN */
app.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

/* UPLOAD (Delete all old videos automatically) */
app.post("/upload", (req, res) => {
  const uploadSingle = upload.single("video");

  uploadSingle(req, res, function (err) {
    if (err) {
      return res.status(500).json({ error: "Upload failed" });
    }

    try {
      const files = fs.readdirSync("uploads");

      // Last uploaded file
      const latestFile = files[files.length - 1];

      // Delete all old videos
      files.forEach(file => {
        if (file !== latestFile) {
          fs.unlinkSync(path.join("uploads", file));
        }
      });

      res.json({ message: "New video uploaded. Old videos deleted permanently." });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Cleanup failed" });
    }
  });
});

/* GET VIDEO LIST */
app.get("/videos", (req, res) => {
  const files = fs.readdirSync("uploads");
  res.json(files);
});

let tickerText = "Welcome to Aman Digital Display";
let logoUrl = "";

/* SETTINGS */
app.post("/settings", (req, res) => {
  if (req.body.text !== undefined) tickerText = req.body.text;
  if (req.body.logo !== undefined) logoUrl = req.body.logo;
  res.json({ success: true });
});

app.get("/settings", (req, res) => {
  res.json({ tickerText, logoUrl });
});

app.listen(3000, () => {
  console.log("🔥 Server running at http://localhost:3000");
});