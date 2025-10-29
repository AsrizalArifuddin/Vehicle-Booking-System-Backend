const db = require("../models");
const fs = require("fs");

const UserAccount = db.UserAccount;

// View Profile - Agent/Company
exports.viewProfile = async (req, res) => {
    try {
        const accountId = req.accountId;
        const account = await UserAccount.findByPk(accountId, {
            attributes: ["account_email", "account_type"],
            include: [
                {
                    model: db.Agent,
                    as: "agent",
                    attributes: ["agent_fullname", "id_type", "id_no", "contact_no", "address", "state", "postcode", "city"],
                    required: false
                },
                {
                    model: db.Company,
                    as: "company",
                    attributes: ["company_name", "registration_no", "sst_no", "contact_no", "address", "state", "postcode", "city", "attc_registration"],
                    required: false
                }
            ]
        });

        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account profile could not be found." });
        }

        // Convert to plain object
        const plain = account.get({ plain: true });

        // Map account_type
        plain.account_type = plain.account_type === 0 ? "Agent" : "Company";

        // Clean up null associations and Map id_type if is agent
        if (plain.account_type === "Agent") {
            delete plain.company;
            if (plain.agent) {
                plain.agent.id_type = plain.agent.id_type === 0 ? "ID Card" : "Passport";
            }
        } else {
            delete plain.agent;
        }

        res.status(200).send({ message: "Your account profile retrieved successfully.", data: plain });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving your profile.", error: err.message });
    }
};

//Update Profile - Agent/Company
exports.updateProfile = async (req, res) => {
    try {
        const accountId = req.accountId;
        const {
            contact_no,
            address,
            city,
            postcode,
            state
        } = req.body;

        const account = await UserAccount.findByPk(accountId);
        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account was not found." });
        }

        // Update Agent or Company
        if (account.account_type === 0) {
            const agent = await db.Agent.findOne({ where: { user_account_id: accountId } });
            if (agent) {
                if (contact_no) agent.contact_no = contact_no;
                if (address) agent.address = address;
                if (city) agent.city = city;
                if (postcode) agent.postcode = postcode;
                if (state) agent.state = state;
                await agent.save();
            }
        } else if (account.account_type === 1) {
            const company = await db.Company.findOne({ where: { user_account_id: accountId } });
            if (company) {
                if (contact_no) company.contact_no = contact_no;
                if (address) company.address = address;
                if (city) company.city = city;
                if (postcode) company.postcode = postcode;
                if (state) company.state = state;
                if (req.file) {
                    const oldPath = company.attc_registration;
                    const newPath = req.file.path;

                    // Delete old file if it exists
                    if (oldPath && fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }

                    company.attc_registration = newPath;
                }
                await company.save();
            }
        }

        res.status(200).send({ message: "Your profile has been updated successfully." });
    } catch (err) {
        res.status(500).send({ message: "Error updating your profile.", error: err.message });
    }
};
