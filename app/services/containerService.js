const { Container, Driver } = require("../models");
const verifyInput = require("../middleware/verifyInput");

// Shared helper functions -------------------------------------------------
const isValidDriver = async (driver_id, userId) => {
    if (!driver_id) return false;
    const driver = await Driver.findOne({
        where: { driver_id, user_account_id: userId }
    });
    return !!driver;
};

const hasCompleteContainerFields = (container) => {
    const { driver_id, container_number, container_size, container_type } = container;
    return !!(driver_id && container_number && container_size && container_type);
};

const insertContainer = async (container, bookingId) => {
    await Container.create({
        booking_id: bookingId,
        driver_id: container.driver_id,
        container_number: container.container_number,
        container_size: container.container_size,
        container_type: container.container_type
    });
};

const updateContainerFields = async (container, updates) => {
    if (updates.driver_id) container.driver_id = updates.driver_id;
    if (updates.container_number) container.container_number = updates.container_number;
    if (updates.container_size) container.container_size = updates.container_size;
    if (updates.container_type) container.container_type = updates.container_type;
    await container.save();
};
//------------------------------------------------------------------------------

// Validate Functions---------------------------------------------------------
const validateContainers = async (containers, userId) => {
    const errors = [];

    if (!Array.isArray(containers) || containers.length === 0) {
        errors.push("At least one container is required.");
        return errors;
    }

    for (let i = 0; i < containers.length; i++) {
        const container = containers[i];

        if (!hasCompleteContainerFields(container)) {
            errors.push(`Container ${i + 1} has incomplete details.`);
            continue;
        }

        const valid = await isValidDriver(container.driver_id, userId);
            if (!valid) {
            errors.push(`Container ${i + 1} references an invalid driver ID: ${container.driver_id}`);
        }
    }

    return errors;
};

const validateContainerAdditions = async (containers, userId) => {
    return await validateContainers(containers, userId);
};

const validateContainerEdits = async (containers, bookingId, userId) => {
    const errors = [];

    for (let i = 0; i < containers.length; i++) {
        const containerUpdate = containers[i];
        const { container_id, driver_id } = containerUpdate;

        if (!container_id) {
            errors.push(`Edit container ${i + 1} is missing container_id.`);
            continue;
        }

        const container = await Container.findOne({
            where: { container_id, booking_id: bookingId }
        });

        if (!container) {
            errors.push(`Edit container ${i + 1} not found or does not belong to this booking.`);
            continue;
        }

        if (driver_id) {
            const valid = await isValidDriver(driver_id, userId);
            if (!valid) {
                errors.push(`Edit container ${i + 1} references invalid driver ID: ${driver_id}`);
            }
        }
    }

    return errors;
};

const validateContainerDeletions = async (containerIds, bookingId) => {
    const errors = [];
    const validIds = [];

    for (const id of containerIds) {
        const container = await Container.findOne({
            where: { container_id: id, booking_id: bookingId }
        });

        if (!container) {
            errors.push(`Container ID ${id} not found or does not belong to this booking.`);
        } else {
            validIds.push(id);
        }
    }

    const totalContainers = await Container.count({ where: { booking_id: bookingId } });
    const remaining = totalContainers - validIds.length;

    // must have at least one container in a booking
    if (remaining <= 0) {
        errors.push("Cannot delete all containers. Booking must have at least one container.");
    }

    return { errors, validIds };
};
//------------------------------------------------------------------------------

// Action Functions---------------------------------------------------------
const createContainers = async (containers, bookingId) => {
    for (const container of containers) {
        await insertContainer(container, bookingId);
    }
};

const applyContainerAdditions = async (containers, bookingId) => {
    await createContainers(containers, bookingId);
};

const applyContainerEdits = async (containers, bookingId) => {
    for (const updates of containers) {
        const container = await Container.findOne({
            where: { container_id: updates.container_id, booking_id: bookingId }
        });

        if (container) {
            await updateContainerFields(container, updates);
        }
    }
};

const applyContainerDeletions = async (validIds, bookingId) => {
    if (validIds.length > 0) {
        await Container.destroy({
            where: {
                container_id: validIds,
                booking_id: bookingId
            }
        });
    }
};

// const deleteContainersByBooking = async (bookingId) => {
//     await Container.destroy({
//         where: { booking_id: bookingId }
//     });
// };

const ContainerService = {
    validateContainers,
    validateContainerAdditions,
    validateContainerEdits,
    validateContainerDeletions,
    createContainers,
    applyContainerAdditions,
    applyContainerEdits,
    applyContainerDeletions//,
    //deleteContainersByBooking
};

module.exports = ContainerService ;