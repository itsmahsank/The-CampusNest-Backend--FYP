const multer = require("multer");
const path = require("path");

// Accept only video files
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".mp4" || ext === ".mov" || ext === ".avi") {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed (mp4, mov, avi)."), false);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Limit: 100MB
  },
});

module.exports = { upload };
