const QRCodeLib = require("qrcode");
const fs = require("fs");
const path = require("path");
const db = require("../models");

const QRCode = db.QRCode;

const generateBookingQR = async (booking, requester, driver, containers) => {
    //const { booking_id, booking_date, booking_type, containers } = booking;
    const { booking_id, booking_date, booking_type } = booking;

    let qrPayload = {
        booking_id,
        booking_date,
        booking_type,
        requester_type: requester.account_type
    };

    if (requester.account_type === "Agent") {
        Object.assign(qrPayload, {
            name: requester.agent_fullname,
            email: requester.account_email,
            contact: requester.contact_no,
        });
    } else if (requester.account_type === "Company") {
        Object.assign(qrPayload, {
            name: requester.company_name,
            email: requester.account_email,
            contact: requester.contact_no,
        });
    }

    qrPayload.driver_name = driver.driver_name;

    qrPayload.containers = containers.map(c => ({
        container_no: c.container_number,
        //size: c.container_size,
        //type: c.container_type,
    }));

    const qrCodeText = JSON.stringify(qrPayload, null, 2);

    console.log("QR Content:\n", qrCodeText);

    return await generateQRCode(qrCodeText);
};

const generateQRCode = async (qrCodeText) => {
    const options = {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        width: 250
    };

    return await QRCodeLib.toBuffer(qrCodeText, options);
};

const saveQRCodeImage = async (buffer, bookingId, driverId) => {
    const fileName = `qr_booking_${bookingId}_${driverId}.png`;
    const filePath = path.join(__dirname, "..", "public", "qr_codes", fileName);

    // Save image to disk
    await fs.promises.writeFile(filePath, buffer);

    // Save to database
    try {
        await QRCode.create({
            driver_id: parseInt(driverId),
            booking_id: parseInt(bookingId),
            qr_code_status: "0",
            qr_code_image_path: `/public/qr_codes/${fileName}`
        });
    } catch (err) {
        console.error("Failed to save QRCode:", err);
        throw err;
    }

    return `/public/qr_codes/${fileName}`;
};

const downloadQR = async (bookingId, driverId, res) => {
    try {
        const qrPath = path.join(__dirname, "..", "public", "qr_codes", `qr_booking_${bookingId}_${driverId}.png`);

        if (!fs.existsSync(qrPath)) {
            return res.status(404).send({ message: "QR code file not found." });
        }

        res.download(qrPath, `qr_booking_${bookingId}_${driverId}.png`, (err) => {
            if (err) {
                return res.status(500).send({ message: "Failed to download QR code.", error: err.message });
            }
        });
    } catch (err) {
        res.status(500).send({ message: "Error downloading QR code.", error: err.message });
    }
};

const qrService = {
    generateBookingQR,
    generateQRCode,
    saveQRCodeImage,
    downloadQR
};

module.exports = qrService ;