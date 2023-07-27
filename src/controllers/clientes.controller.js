import { db } from "../database/database.connection.js";
import { stripHtml } from "string-strip-html";
import { format } from 'date-fns';

export async function listarClientes(req, res) {

    const { cpf, order, desc, limit, offset } = req.query;

    try {

        let listaClientes;

        let query = 'SELECT * FROM customers';

        if (cpf) {
            query += ' WHERE cpf ILIKE $1';
        }

        if (order) {
            query += ` ORDER BY ${order}`;
          
            if (desc === "true") {
              query += ' DESC';
            } else {
              query += ' ASC';
            }
          }

        if (limit) {
            query += ` LIMIT ${parseInt(limit)}`;
        }

        if (offset) {
            query += ` OFFSET ${parseInt(offset)}`;
        }

        if (cpf) {
            listaClientes = await db.query(query, [`%${cpf}%`]);
        } else {
            listaClientes = await db.query(query);
        }

        const clientesFormatados = listaClientes.rows.map(cliente => ({
            ...cliente,
            birthday: format(new Date(cliente.birthday), 'yyyy-MM-dd')
        }));

        res.send(clientesFormatados);

    } catch (err) {
        res.status(500).send(err.message);
    }
}

export async function clientesPorID(req, res) {

    const { id } = req.params;

    try {

        const cliente = await db.query('SELECT * FROM customers WHERE id = $1;', [id]);

        if (cliente.rows.length === 0) return res.status(404).send({ message: "Cliente não encontrado pelo id", id });

        const clienteFormatado = {
            ...cliente.rows[0],
            birthday: format(new Date(cliente.rows[0].birthday), 'yyyy-MM-dd')
        };

        return res.status(200).send(clienteFormatado);

    } catch (err) {

        return res.status(500).send(err.message);

    }
}

export async function inserirClientes(req, res) {
    const { name, phone, cpf, birthday } = req.body;

    const sanitizedName = stripHtml(name).result.trim();
    const sanitizedPhone = stripHtml(phone).result.trim();
    const sanitizedcpf = stripHtml(cpf).result.trim();
    const sanitizedBirthday = stripHtml(birthday).result.trim();

    console.log(sanitizedBirthday);

    try {
        const cpfRepetido = await db.query('SELECT * FROM customers WHERE cpf = $1;', [sanitizedcpf]);

        if (cpfRepetido.rows.length > 0) {
            return res.status(409).send("Cliente já existente no Banco de Dados!");
        }

        await db.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);', [sanitizedName, sanitizedPhone, sanitizedcpf, sanitizedBirthday]);

        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err.message);
    }
}

export async function editaClientes(req, res) {

    const { id } = req.params;

    const { name, phone, cpf, birthday } = req.body;

    const sanitizedName = stripHtml(name).result.trim();
    const sanitizedPhone = stripHtml(phone).result.trim();
    const sanitizedcpf = stripHtml(cpf).result.trim();
    const sanitizedBirthday = stripHtml(birthday).result.trim();

    try {

        const cpfRepetido = await db.query('SELECT * FROM customers WHERE cpf = $1 AND id != $2;', [sanitizedcpf, id]);

        if (cpfRepetido.rows.length > 0) {
            return res.status(409).send("Cliente já existente no Banco de Dados!");
        }

        const result = await db.query('UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5', [sanitizedName, sanitizedPhone, sanitizedcpf, sanitizedBirthday, id])

        res.send("Cliente atualizado com sucesso!");

    } catch (err) {
        res.status(500).send(err.message);
    }
}
