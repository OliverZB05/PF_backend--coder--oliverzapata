import TicketRepository from '../repositories/tickets.repository.js';

const ticketRepository = new TicketRepository();

export default class TicketService {
    async createTicket(ticketData) {
        const ticket = await ticketRepository.create(ticketData);
        return ticket;
    }
}
