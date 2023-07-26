import { db } from "../database/database.connection.js";
import { stripHtml } from "string-strip-html";

export async function inserirAlugueis(req, res) {
    const { customerId, gameId, daysRented } = req.body;

    const sanitizedcustomerId = stripHtml(String(customerId)).result.trim();
    const sanitizedgameId = stripHtml(String(gameId)).result.trim();
    const sanitizeddaysRented = stripHtml(String(daysRented)).result.trim();

    try {
        const clienteExiste = await db.query('SELECT * FROM customers WHERE id = $1;', [sanitizedcustomerId]);

        if (clienteExiste.rows.length === 0) {
            return res.status(400).send("Não consta no sistema o id do cliente fornecido!");
        }

        const gameExiste = await db.query('SELECT * FROM games WHERE id = $1;', [sanitizedgameId]);

        if (gameExiste.rows.length === 0) {
            return res.status(400).send("Não consta no sistema o id do game fornecido!");
        }

        if (sanitizeddaysRented <= 0) {
            return res.status(400).send("Por favor, adicione uma quantidade de dias maior que 0!");
        }

        const result = await db.query(`SELECT COUNT(*) AS alugueis_em_aberto FROM rentals WHERE "gameId" = $1 AND "returnDate" IS NULL;`, [sanitizedgameId]);

        const alugueisEmAberto = parseInt(result.rows[0].alugueis_em_aberto);
        const estoqueTotal = gameExiste.rows[0].stockTotal;
        const jogosDisponiveis = estoqueTotal - alugueisEmAberto;

        if (jogosDisponiveis <= 0) {
            return res.status(400).send("Não há jogos disponíveis para alugar.");
        }

        const rentDate = new Date().toISOString().slice(0, 10);

        const originalPrice = sanitizeddaysRented * gameExiste.rows[0].pricePerDay;

        const insertRentalQuery = `
      INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
      VALUES ($1, $2, $3, $4, NULL, $5, NULL)
      RETURNING *;
    `;
        const values = [sanitizedcustomerId, sanitizedgameId, rentDate, sanitizeddaysRented, originalPrice];

        await db.query(insertRentalQuery, values);

        res.sendStatus(201);

    } catch (err) {
        res.status(500).send(err.message);
    }
}