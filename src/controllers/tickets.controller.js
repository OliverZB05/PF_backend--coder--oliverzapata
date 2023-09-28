import TicketService from '../service/tickets.service.js';

const ticketService = new TicketService();

const createTicketController = async (req, res) => {
    const ticketData = req.body; // Asume que los datos del ticket vienen en el cuerpo de la solicitud
    const ticket = await ticketService.createTicket(ticketData);
    res.json(ticket);
}

export { createTicketController };
