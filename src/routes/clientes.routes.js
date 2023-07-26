import { Router } from "express";
import { clientesPorID, editaClientes, inserirClientes, listarClientes } from "../controllers/clientes.controller.js";
import { schemaClientes } from "../schemas/clientes.schemas.js";
import { validateSchema } from "../middlewares/validateSchema.js";

const clientesRouter = Router();

clientesRouter.get("/customers", listarClientes );
clientesRouter.get("/customers/:id", clientesPorID );
clientesRouter.post("/customers", validateSchema(schemaClientes),inserirClientes);
clientesRouter.put("/customers/:id", validateSchema(schemaClientes), editaClientes);


export default clientesRouter;
