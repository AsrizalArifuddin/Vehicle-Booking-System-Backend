const db = require("../models");
const { Op } = require("sequelize");

const UserAccount = db.UserAccount;
const Agent = db.Agent;
const Company = db.Company;
const Driver = db.Driver;
const Booking = db.Booking;
const Container = db.Container;
const notificationService = require("../services/sendNotification");
const qrService = require("../services/qrCodeGenerator")
const ContainerService = require("../services/containerService");

exports.getDriverList = async (req, res) => {
    try {
        const userId = req.accountId;

        const account = await UserAccount.findByPk(userId);
        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account was not found." });
        }

        const drivers = await Driver.findAll({
        where: { user_account_id: userId },
            attributes: ["driver_id", "driver_name"] //Display id and name only
        });

        // No driver found/ added before
        if (drivers.length === 0) {
            return res.status(200).send({ message: "No drivers found under your account.", data: [] });
        }

        res.status(200).send({ message: "Driver list retrieved successfully.", data: drivers });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving driver list.", error: err.message });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const userId = req.accountId;

        const account = await UserAccount.findByPk(userId);
        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account was not found." });
        }

        // Input data needed
        const { booking_date, booking_type, containers } = req.body;

        // Validate booking details
        if (!booking_date || booking_type === undefined) {
            return res.status(400).send({ message: "Missing booking details." });
        }

        // Validate Booking Date Format
        if (booking_date && !/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
            return res.status(400).send({ message: "Invalid date format. Use YYYY-MM-DD." });
        }

        // Validate Booking Type
        if (booking_type !==undefined && ![0, 1].includes(booking_type)) {
            return res.status(400).send({ message: "The booking type only can be 0(import) and 1(export)" });
        }

        // Container Validation
        const containerErrors = await ContainerService.validateContainers(containers, userId);
        if (containerErrors.length > 0) {
            return res.status(400).send({ message: "Container validation failed.", errors: containerErrors });
        }

        const newBooking = await Booking.create({
            user_account_id: userId,
            booking_date,
            booking_type,
            booking_status: 0, // pending approval
            booking_created_at: new Date()
        });

        await ContainerService.createContainers(containers, newBooking.booking_id);

        // Trigger notification to Port Staff/Admin
        // await notificationService.sendEmail(
        //     "port_staff_admin",  // need to ask .............................................
        //     "New Booking Request",
        //     `A new booking has been submitted by ${req.user?.account_name || "Agent/Company"} for ${booking_date}.`,
        //     null);

        res.status(201).send({ message: "Booking request submitted successfully.", data: newBooking });
    } catch (err) {
        res.status(500).send({ message: "Failed to save booking.", error: err.message });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const userId = req.accountId;
        const account = await UserAccount.findByPk(userId);
        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account was not found." });
        }

        const bookingId = req.params.bookingId;
        const {
            booking_date,
            booking_type,
            containers_to_update,
            containers_to_add,
            containers_to_delete
        } = req.body;

        // Check booking pending status and booking requester
        const booking = await Booking.findByPk(bookingId);
        if (!booking || booking.user_account_id !== userId) {
            return res.status(404).send({ message: "Booking not found or access denied." });
        }

        if (booking.booking_status !== 0) {
            return res.status(403).send({ message: "Only pending bookings can be updated." });
        }

        // Validate Booking Date Format
        if (booking_date && !/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
            return res.status(400).send({ message: "Invalid date format. Use YYYY-MM-DD." });
        }

        // Validate Booking Type
        if (booking_type !==undefined && ![0, 1].includes(booking_type)) {
            return res.status(400).send({ message: "The booking type only can be 0(import) and 1(export)" });
        }

        // Validate containers first (if provided)
        const errors = [];

        if (Array.isArray(containers_to_add)) {
            const addErrors = await ContainerService.validateContainerAdditions(containers_to_add, userId);
            errors.push(...addErrors);
        }

        if (Array.isArray(containers_to_update)) {
            const updateErrors = await ContainerService.validateContainerEdits(containers_to_update, bookingId, userId);
            errors.push(...updateErrors);
        }

        if (errors.length > 0) {
            return res.status(400).send({ message: "Validation failed.", errors });
        }

        // Booking field updates
        if (booking_date) booking.booking_date = booking_date;
        if (booking_type !== undefined) booking.booking_type = booking_type;
        await booking.save();

        // Apply container changes
        if (Array.isArray(containers_to_update)) {
            await ContainerService.applyContainerEdits(containers_to_update, bookingId);
        }

        if (Array.isArray(containers_to_add)) {
            await ContainerService.applyContainerAdditions(containers_to_add, bookingId);
        }

        if (Array.isArray(containers_to_delete)) {
            const { errors: deletionErrors, validIds }
                = await ContainerService.validateContainerDeletions(containers_to_delete, bookingId);
            if (deletionErrors.length > 0) {
                return res.status(400).send({
                    message: "Container deletion failed.",
                    errors: deletionErrors
                });
            }

            await ContainerService.applyContainerDeletions(validIds, bookingId);
        }

        // Notify port staff/admin
        // await notificationService.sendEmail(
        // "port_staff_admin",  // need to ask .............................................
        // "Booking Updated",
        // `Booking ID ${bookingId} has been updated by ${req.user?.account_email || "an agent/company"}.`,
        // null);

        res.status(200).send({ message: "Booking updated successfully.", data: booking });
    } catch (err) {
        res.status(500).send({ message: "Failed to update booking.", error: err.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const userId = req.accountId;
        const account = await UserAccount.findByPk(userId);
        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account was not found." });
        }

        const bookingId = req.params.bookingId;

        // Check booking pending status
        const booking = await Booking.findByPk(bookingId);
        if (booking.booking_status !== 0) {
            return res.status(403).send({ message: "Only pending bookings can be canceled." });
        }

        // Update booking status to canceled (3)
        booking.booking_status = 3;
        await booking.save();

        // Delete booking and containers
        // await ContainerService.deleteContainersByBooking(bookingId);
        // await booking.destroy();

        // Notify port staff/admin
        // await notificationService.sendEmail(
        //     "port@example.com",
        //     "Booking Canceled",
        //     `Booking ID ${bookingId} has been canceled by ${req.user?.account_email || "an agent/company"}.`,
        //     null);

        res.status(200).send({ message: "Booking canceled successfully." });
    } catch (err) {
        res.status(500).send({ message: "Failed to cancel booking.", error: err.message });
    }
};

exports.getPendingBookings = async (req, res) => {
    try {
        const pending = await Booking.findAll({
            where: { booking_status: 0 },
            include: [
                {
                    model: UserAccount,
                    as: "user",
                    attributes: ["user_account_id", "account_type", "account_email"]
                },
                {
                    model: Container,
                    as: "containers",
                    include: [
                        {
                            model: Driver,
                            as: "driver",
                            attributes: ["driver_id", "driver_name"]
                        }
                    ]
                }
            ]
        });

        // If no pending bookings, return message
        if (!pending || pending.length === 0) {
            return res.status(200).send({
                message: "No pending booking requests found."
            });
        }

        const formatted = await Promise.all(pending.map(async booking => {
            const user = booking.user;
            let requester = {};

            if (user.account_type === 0  && user.user_account_id) {     // Agent
                const agent = await Agent.findOne({ where: { user_account_id: user.user_account_id } });
                if (agent) {
                    requester = {
                        user_account_id: user.user_account_id,
                        account_type: "Agent",
                        agent_fullname: agent.agent_fullname,
                        account_email: user.account_email,
                        contact_no: agent.contact_no,
                        id_no: agent.id_no
                    };
                }
            } else if (user.account_type === 1 && user.user_account_id) {     // Company
                const company = await Company.findOne({ where: { user_account_id: user.user_account_id } });
                if (company) {
                    requester = {
                        user_account_id: user.user_account_id,
                        account_type: "Company",
                        company_name: company.company_name,
                        account_email: user.account_email,
                        contact_no: company.contact_no,
                        registration_no: company.registration_no,
                        sst_no: company.sst_no
                    };
                }
            }

            const containers = booking.containers.map(c => ({
                container_id: c.container_id,
                container_number: c.container_number,
                container_size: c.container_size,
                container_type: c.container_type,
                driver_name: c.driver?.driver_name || null
            }));

            return {
                booking_id: booking.booking_id,
                booking_date: booking.booking_date,
                booking_type: booking.booking_type,
                requester,
                containers
            };
        }));

        res.status(200).send({
            message: "Pending bookings retrieved.",
            data: formatted
        });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving pending bookings.", error: err.message });
    }
};

exports.approveOrRejectBooking = async (req, res) => {
    try {
        const { bookingId, action } = req.body;

        //Find the booking
        const booking = await Booking.findOne({
            where: { booking_id: bookingId },
            include: [
                {
                    model: UserAccount,
                    as: "user",
                    attributes: ["user_account_id", "account_type", "account_email"]
                },
                {
                    model: Container,
                    as: "containers",
                    include: [
                        {
                            model: Driver,
                            as: "driver",
                            attributes: ["driver_id", "driver_name"]
                        }
                    ]
                }
            ]
        });

        if (!booking) {
            return res.status(404).send({ message: "Booking not found." });
        }

        if (booking.booking_status !== 0) {
            return res.status(403).send({ message: "Only pending bookings can be approved or rejected." });
        }

        // Validate action
        if (![1, 2].includes(action)) {
            return res.status(400).send({ message: "Invalid action. Use 1 for approve, 2 for reject." });
        }

        // Update booking status
        booking.booking_status = action;
        await booking.save();

        // Get requester details
        const user = booking.user;
        let requester = {};
        let requesterName = "";

        if (user.account_type === 0) {
            const agent = await Agent.findOne({ where: { user_account_id: user.user_account_id } });
            if (agent) {
                requester = {
                    account_type: "Agent",
                    agent_fullname: agent.agent_fullname,
                    account_email: user.account_email,
                    contact_no: agent.contact_no,
                    id_no: agent.id_no
                };
                requesterName = agent.agent_fullname;
            }
        } else if (user.account_type === 1) {
            const company = await Company.findOne({ where: { user_account_id: user.user_account_id } });
            if (company) {
                requester = {
                    account_type: "Company",
                    company_name: company.company_name,
                    account_email: user.account_email,
                    contact_no: company.contact_no,
                    registration_no: company.registration_no,
                    sst_no: company.sst_no
                };
                requesterName = company.company_name;
            }
        }

        let qrCodeBuffers = [];
        // Generate QR code if approved
        if (action === 1) {
            const uniqueDrivers = new Map();

            for (const container of booking.containers) {
                const driver = container.driver;
                    if (driver && !uniqueDrivers.has(driver.driver_id)) {
                        uniqueDrivers.set(driver.driver_id, driver);
                    }
            }

            for (const [driverId, driver] of uniqueDrivers.entries()) {
                const driverContainers = booking.containers.filter(c => c.driver?.driver_id === driverId);
                const qrCodeBuffer = await qrService.generateBookingQR(booking, requester, driver, driverContainers);
                if (qrCodeBuffer) {
                    await qrService.saveQRCodeImage(qrCodeBuffer, booking.booking_id, driverId);

                    // Store buffer for email attachment
                    //qrCodeBuffers.push(qrCodeBuffer);
                    qrCodeBuffers.push({
                        driverId,
                        buffer: qrCodeBuffer
                    });
                }
            }
        }

        // Send notification
        const statusText = action === 1 ? "Approved" : "Rejected";
        const message = action === 1
            ? `Dear ${requesterName}, your booking ID: ${bookingId} has been approved.\nQR Code attached below.`
            : `Dear ${requesterName}, your booking ID: ${bookingId} has been rejected.`;

        // await notificationService.sendEmail(user.account_email, `Booking ${statusText}`, message, qrCodeBuffer);
        await notificationService.sendEmail(user.account_email, `Booking ${statusText}`, message, qrCodeBuffers.map(q => q.buffer));

        // Option 1
        // const qrCodeDataUrl = qrCodeBuffer
        //    /?`data:image/png;base64,${qrCodeBuffer.toString("base64")}`
        //     : null;
        // res.status(200).send({
        //     message: `Booking ${statusText} successfully.`,
        //     qrCode: qrCodeDataUrl
        // });

        // Option 2
        // res.setHeader("Content-Type", "image/png");
        // res.setHeader("Content-Disposition", "inline; filename=booking_qr.png");
        // return res.send(qrCodeBuffer);

        // Option 3
        res.status(200).send({ message: `Booking ${statusText} Successfully.` });
    } catch (err) {
        res.status(500).send({ message: "Error processing booking approval.", error: err.message });
    }
};

exports.getBookingList = async (req, res) => {
    try {
        const userId = req.accountId;

        const bookings = await Booking.findAll({
            where: { user_account_id: userId },
            attributes: ["booking_id", "booking_date", "booking_type", "booking_status"],
            order: [["booking_date", "DESC"]]
        });

        if(!bookings || bookings.length === 0) {
            return res.status(200).send({ message: "No bookings found.", data: [] });
        }

        res.status(200).send({ message: "Your bookings retrieved successfully.", data: bookings });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving bookings.", error: err.message });
    }
};

exports.getBookingDetails = async (req, res) => {
    try {
        const userId = req.accountId;
        const bookingId = req.params.bookingId;

        const booking = await Booking.findOne({
        where: {
            booking_id: bookingId,
            user_account_id: userId
        },
        include: [
            {
                model: Container,
                as: "containers",
                include: [
                    {
                        model: Driver,
                        as: "driver",
                        attributes: ["driver_id", "driver_name", "driver_contact_no"]
                    }
                ]
            }
        ]
        });

        res.status(200).send({ message: "Booking details retrieved successfully.", data: booking});
    } catch (err) {
        res.status(500).send({ message: "Error retrieving booking details.", error: err.message });
    }
};

exports.searchBookings = async (req, res) => {
    try {
        const userId = req.accountId;
        const { keyword } = req.query;

        if (!keyword) {
            return res.status(400).send({ message: "Keyword is required for searching." });
        }

        // Map keyword to booking_type or booking_status
        const typeMap = { import: 0, export: 1 };
        const statusMap = { pending: 0, approved: 1, rejected: 2, canceled: 3 };

        const normalized = keyword.toLowerCase();
        const mappedType = typeMap[normalized];
        const mappedStatus = statusMap[normalized];

        const topLevelWhere = {
            user_account_id: userId,
            [Op.or]: [
                { booking_id: keyword },
                mappedType !== undefined ? { booking_type: mappedType } : null,
                mappedStatus !== undefined ? { booking_status: mappedStatus } : null,
                { "$containers.container_number$": { [Op.like]: `%${keyword}%` } },
                { "$containers.driver.driver_name$": { [Op.like]: `%${keyword}%` } }
            ].filter(Boolean)
        };

        const bookings = await Booking.findAll({
            where: topLevelWhere,
            include: [{
                model: Container,
                as: "containers",
                required: false,
                include: [{
                    model: Driver,
                    as: "driver",
                    attributes: ["driver_id", "driver_name"],
                    required: false
                }]
            }],
            order: [["booking_date", "DESC"]]
        });

        if (bookings.length === 0) {
            return res.status(200).send({ message: "No bookings matched your search.", data: []});
        }

        res.status(200).send({ message: "Search results retrieved.", data: bookings});
    } catch (err) {
        res.status(500).send({ message: "Error searching your bookings.", error: err.message });
    }
};

exports.viewApprovedBookingQR = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;

        // Check if booking is approved
        const booking = await Booking.findOne({
            where: {
                booking_id: bookingId,
                booking_status: 1 // approved
            },
            attributes: ["booking_id", "booking_date"]
        });

        if (!booking) {
            return res.status(404).send({ message: "Approved booking not found." });
        }

        // Retrieve QR code details from service
        const qrList = await qrService.getQRDetailsByBooking(bookingId);

        if (!qrList) { // Should not happen in approved booking
            return res.status(404).send({ message: "No QR codes found for this booking." });
        }

        return res.status(200).send({
            booking_id: booking.booking_id,
            booking_date: booking.booking_date,
            qr_codes: qrList
        });
    } catch (error) {
        return res.status(500).send({ message: "Error retrieving QR codes.", error: error.message });
    }
};

exports.downloadQRCode = async (req, res) => {
    try {
        const { bookingId, driverId } = req.params;

        // Check approved status
        const booking = await Booking.findByPk(bookingId);
        if (booking.booking_status !== 1) {
            return res.status(400).send({ message: "QR code is only available for approved bookings." });
        }

        // pass to services/qrCodeGenerator to handle download
        return qrService.downloadQR(bookingId, driverId, res);
    } catch (err) {
        res.status(500).send({ message: "Error validating QR download.", error: err.message });
    }
};