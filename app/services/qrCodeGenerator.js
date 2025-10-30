const QRCodeLib = require("qrcode");
const fs = require("fs");
const path = require("path");
const db = require("../models");

const QRCode = db.QRCode;
const Driver = db.Driver;

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
    const filePath = path.join("C:", "Users", "user", "Downloads", "VBS_Testing",
            "booking_qr", `qr_booking_${bookingId}_${driverId}.png`);

    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    // Save image to disk
    await fs.promises.writeFile(filePath, buffer);

    // Save to database
    try {
        await QRCode.create({
            driver_id: parseInt(driverId),
            booking_id: parseInt(bookingId),
            qr_code_status: "0",
            qr_code_image_path: filePath
        });
    } catch (err) {
        console.error("Failed to save QRCode:", err);
        throw err;
    }

    return filePath;
};

const getQRDetailsByBooking = async (bookingId) => {
    const qrEntries = await QRCode.findAll({
        where: { booking_id: bookingId },
        include: [
            {
                model: Driver,
                as: "driver",
                attributes: ["driver_id", "driver_name"]
            }
        ],
        attributes: ["qr_code_status", "qr_code_image_path"]
    });

    if (!qrEntries.length) {
        return null;
    }

    return qrEntries.map(entry => {
        return {
            driver_id: entry.driver.driver_id,
            driver_name: entry.driver.driver_name,
            qr_status: entry.qr_code_status,
            qr_path: entry.qr_code_image_path
        };
    });
};

const downloadQR = async (bookingId, driverId, res) => {
    try {
        const qrPath = path.join("C:", "Users", "user", "Downloads", "VBS_Testing",
            "booking_qr", `qr_booking_${bookingId}_${driverId}.png`);

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
    getQRDetailsByBooking,
    downloadQR
};

module.exports = qrService ;