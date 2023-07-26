import Joi from "joi";

export const schemaClientes = Joi.object({
    cpf: Joi.string().length(11).pattern(/^[0-9]+$/).required(),
    phone: Joi.string().pattern(/^[0-9]+$/).min(10).max(11).required(),
    name: Joi.string().trim().min(1).required(),
    birthday: Joi.date().required()
});