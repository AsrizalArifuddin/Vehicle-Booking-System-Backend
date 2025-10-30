const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join("C:", "Users", "user", "Downloads", "VBS_Testing", "attc_pdfs")
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uploadDir = path.join("C:", "Users", "user", "Downloads", "VBS_Testing", "attc_pdfs");
        const baseName = path.basename(file.originalname, path.extname(file.originalname));
        const ext = path.extname(file.originalname); // ".pdf"

        let finalName = `${baseName}${ext}`;
        let counter = 1;

        while (fs.existsSync(path.join(uploadDir, finalName))) {
            finalName = `${baseName}(${counter})${ext}`;
            counter++;
        }

        cb(null, finalName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed."), false);
    }
};

const uploadFile = multer({ storage, fileFilter });

module.exports = uploadFile;