import ticketModel from "../dao/dbManagers/models/ticket.model.js";

export default class TicketRepository {
    async create(ticketData) {
        // Crear un nuevo ticket en la base de datos
        const ticket = await ticketModel.create(ticketData);
        return ticket;
    }
}
