import { Router } from "express";
import { validateSchema } from "../middlewares/validateSchema.js";
import { schemaAlugueis } from "../schemas/alugueis.schemas.js";
import { inserirAlugueis } from "../controllers/alugueis.controller.js";

const alugueisRouter = Router();

alugueisRouter.post("/rentals", validateSchema(schemaAlugueis),inserirAlugueis);

export default alugueisRouter;