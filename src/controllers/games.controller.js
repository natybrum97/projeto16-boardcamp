import { db } from "../database/database.connection.js";
import { stripHtml } from "string-strip-html";

export async function listarGames (req, res) {

    const { name } = req.query;

    try {

        let listaGames;

        if (name) {
      
            listaGames = await db.query('SELECT * FROM games WHERE name ILIKE $1', [`%${name}%`]);

          } else {

            listaGames = await db.query(`SELECT * FROM games;`)

          }
        
        res.send(listaGames.rows);

    } catch (err) {
        res.status(500).send(err.message);
    }
}

export async function inserirGames(req, res) {
    const { name, image, stockTotal, pricePerDay } = req.body;

    const sanitizedName = stripHtml(name).result.trim();
    const sanitizedImage = stripHtml(image).result.trim();
    const sanitizedStockTotal = stripHtml(String(stockTotal)).result.trim();
    const sanitizedPricePerDay = stripHtml(String(pricePerDay)).result.trim();

    try {
        const nomeRepetido = await db.query('SELECT * FROM games WHERE name = $1;', [sanitizedName]);

        if (nomeRepetido.rows.length > 0) {
            return res.status(409).send("Nome de jogo já existente!");
        }

        if (sanitizedStockTotal <= 0 || sanitizedPricePerDay <= 0) {
            return res.status(400).send("O número deve ser maior que 0!");
        }

        await db.query('INSERT INTO games (name, image, "stockTotal", "pricePerDay") VALUES ($1, $2, $3, $4);', [sanitizedName, sanitizedImage, sanitizedStockTotal, sanitizedPricePerDay]);

        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err.message);
    }
}

