import { db } from "../database/database.connection.js";
import { stripHtml } from "string-strip-html";
import { format, differenceInDays } from 'date-fns';

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

export async function listarAlugueis(req, res) {



    try {


        const listaAlugueis = await db.query(` SELECT rentals.id, rentals."customerId", rentals."gameId", rentals."rentDate", rentals."daysRented",
        rentals."returnDate", rentals."originalPrice", rentals."delayFee", customers.id AS "customer.id", customers.name AS "customer.name",
        games.id AS "game.id", games.name AS "game.name" FROM rentals
        JOIN customers ON rentals."customerId" = customers.id
        JOIN games ON rentals."gameId" = games.id;`);

        const formattedResult = listaAlugueis.rows.map(item => ({
            id: item.id,
            customerId: item.customerId,
            gameId: item.gameId,
            rentDate: item.rentDate,
            daysRented: item.daysRented,
            returnDate: item.returnDate,
            originalPrice: item.originalPrice,
            delayFee: item.delayFee,
            customer: {
              id: item["customer.id"],
              name: item["customer.name"]
            },
            game: {
              id: item["game.id"],
              name: item["game.name"]
            }
          }));

        res.send(formattedResult);

    } catch (err) {
        res.status(500).send(err.message);
    }
}


export async function deletaAluguel(req, res) {

    const { id } = req.params;

    try {

        const result = await db.query('SELECT * FROM rentals WHERE id = $1;', [id]);

        if (result.rowCount === 0) return res.status(404).send("Esse aluguel não consta no sistema!");

        if (result.rows[0].returnDate === null || undefined) return res.status(400).send({ message: "Aluguel não finalizado" });

        const deletando = await db.query('DELETE FROM rentals WHERE id = $1;', [id]);

        res.status(200).send("Produto deletado com sucesso!");

    } catch (err) {
        res.status(500).send(err.message);
    }
}

export async function finalizarAlugueis(req, res) {
    const { id } = req.params;

    try {
        const idExiste = await db.query('SELECT * FROM rentals WHERE id = $1;', [id]);

        if (idExiste.rowCount === 0) return res.status(404).send("Aluguel não encontrado pelo id!");

        if (idExiste.rows[0].returnDate !== null) return res.status(400).send({ message: "Aluguel já finalizado" });

        const rentDate = idExiste.rows[0].rentDate.toISOString().slice(0, 10);

        const dataAtual = new Date().toISOString().slice(0, 10);

        const diferencaEmDias = differenceInDays(new Date(dataAtual), new Date(rentDate));

        const menosDiasAlugados = diferencaEmDias - (parseInt(idExiste.rows[0].daysRented));

        const multa = menosDiasAlugados * (parseInt(idExiste.rows[0].originalPrice));

        let query;

        if(diferencaEmDias <= (parseInt(idExiste.rows[0].daysRented))){
            
            query = `UPDATE rentals SET "returnDate" = $1 WHERE id = $2;`;
            await db.query(query, [dataAtual, id]);
        } else {
            query = `UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3;`;
            await db.query(query, [dataAtual, multa, id]);
        }

        res.status(200).send("Produto Entregue!!");
    } catch (err) {
        res.status(500).send(err.message);
    }
}

