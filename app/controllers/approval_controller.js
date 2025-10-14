const db = require("../models");
const notificationService = require("../services/sendNotification");

const UserAccount = db.UserAccount;
//const UserNotification = db.UserNotification;

// Keep aside first - For send WhatsApp
// async function getContactNo(user) {
//     if (user.account_type === 0) {
//         const agent = await db.Agent.findOne({ where: { user_account_id: user.user_account_id } });
//         return agent?.contact_no;
//     } else {
//         const company = await db.Company.findOne({ where: { user_account_id: user.user_account_id } });
//         return company?.contact_no;
//     }
// }

exports.getPendingUsers = async (req, res) => {
    try {
        const rawUsers = await UserAccount.findAll({
            where: { account_status: 0 },
            attributes: ["user_account_id", "account_email", "account_type"],
            include: [
                {
                    model: db.Agent,
                    as: "agent",
                    attributes: ["agent_fullname", "id_no", "contact_no", "address", "state", "postcode", "city"],
                    required: false
                },
                {
                    model: db.Company,
                    as: "company",
                    attributes: ["company_name", "registration_no", "sst_no", "contact_no",
                                "address", "state", "postcode", "city", "attc_registration"],
                    required: false
                }
            ]
        });

        // If no pending users, return message
        if (rawUsers.length === 0) {
            return res.status(200).send({
                message: "No pending user accounts found."
            });
        }

        // Clean up null associations while getting data
        const pendingUsers = rawUsers.map(user => {
            const plain = user.get({ plain: true });
            if (plain.account_type === 0) {
                delete plain.company;
            } else if (plain.account_type === 1) {
                delete plain.agent;
            }
            return plain;
        });

        res.status(200).send(pendingUsers);
    } catch (err) {
        res.status(500).send({ message: "Failed to fetch pending users.", error: err.message });
    }
};

exports.processDecision = async (req, res) => {
    const { user_account_id, decision } = req.body; // decision = 1 (approve), 2 (reject), 3(delete)

    try {
        const user = await UserAccount.findByPk(user_account_id);
        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }

        // Validate decision
        if (![1, 2, 3].includes(decision)) {
            return res.status(400).send({
                message: "Invalid decision value."
            });
        }

        user.account_status = decision;
        await user.save();

        // Determine status text
        let statusText = "";
        if (decision === 1) {
            statusText = "approved";
        } else {
            statusText = "rejected"; // Treat both 2 and 3 as rejection
        }
        //const now = new Date();

        // Keep aside first
        // await UserNotification.create({
        //     user_account_id: user.user_account_id,
        //     un_created_at: now,
        //     un_desc: `Your registration has been ${statusText} by the port officer.`,
        //     un_status: 0
        // });

        await notificationService.sendEmail(user.account_email,
            `Registration ${statusText}`,
            `Your registration has been ${statusText} by the port officer.`);

        // Send WhatsApp notification // Keep aside first
        // const contact_no = await getContactNo(user); //fetch from Agent or Company
        // await notificationService.sendWhatsApp(contact_no, `Your registration has been ${statusText}.`);

        res.status(200).send({ message: `User successfully ${statusText}.` });
    } catch (err) {
        res.status(500).send({ message: "Failed to process decision.", error: err.message });
    }
};