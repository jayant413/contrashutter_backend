import multer from 'multer';
import path from 'path';

// Define storage engine for Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/images');  // Directory to store images
    },
    filename: function (req, file, cb) {
        cb(null, 'temp-' + Date.now() + path.extname(file.originalname));  // Unique filename
    },
});

// Create Multer upload middleware with the defined storage
const upload = multer({ storage: storage });

export default upload;
