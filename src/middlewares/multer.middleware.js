import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../../public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
  // in ES6 if key and value name is ame we could be written like above
  // i.e. { storage:storage }  =>  { storage }
});
