// Validateurs Joi réutilisables

import Joi from 'joi';

export const userValidators = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/).required(),
    first_name: Joi.string().min(2).max(50).required(),
    birthdate: Joi.date().max('now').required(),
    city: Joi.string().min(2).max(100).required(),
    postal_code: Joi.string().min(4).max(10).required(),
    sex: Joi.string().valid('man', 'woman').required(),
    looking_for: Joi.string().valid('man', 'woman').required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

export const matchValidators = {
  find: Joi.object({
    // Pas de body nécessaire
  }),
};

export const chatValidators = {
  send: Joi.object({
    conversation_id: Joi.string().uuid().required(),
    content: Joi.string().min(1).max(2000).required(),
  }),
};

export default {
  userValidators,
  matchValidators,
  chatValidators,
};