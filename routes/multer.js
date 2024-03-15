const multer = require("multer");
const path = require('path');
const {v4: uuidv4} = require("uuid");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
    const filename= uuidv4();
      cb(null, filename + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage: storage })

  module.exports=upload;