const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Storage configuration
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    cb(null, uuidv4() + "_" + file.originalname);
  },
});

// File filter (optional): Accept images and documents only
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "text/plain", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const upload = multer({ storage, fileFilter });

let clipboardDB = {}; // Temporary in-memory DB

// Upload route
app.post("/upload", upload.array("files"), (req, res) => {
  const { text } = req.body;
  const code = uuidv4().slice(0, 6);

  clipboardDB[code] = {
    text,
    files: req.files.map((f) => ({
      name: f.originalname,
      path: f.path,
      url: `https://online-clipboard-z9bd.onrender.com/${f.path}`,
      mimetype: f.mimetype,
    })),
    createdAt: new Date(),
  };

  res.json({ code });
});

// Fetch by code
app.get("/clipboard/:code", (req, res) => {
  const { code } = req.params;
  const data = clipboardDB[code];

  if (!data) return res.status(404).json({ error: "Code not found" });
  res.json(data);
});

// Server
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
