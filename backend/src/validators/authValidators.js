// src/validators/authValidators.js
const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ success: false, message: messages });
  }
  next();
};

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const generateSchema = Joi.object({
  contentType: Joi.string()
    .valid('instagram', 'facebook', 'email', 'youtube', 'blog', 'stories')
    .required()
    .messages({ 'any.only': 'contentType must be one of: instagram, facebook, email, youtube, blog, stories' }),
  listing: Joi.object({
    address: Joi.string().min(5).max(500).required().messages({
      'string.min': 'Address must be at least 5 characters',
      'any.required': 'Listing address is required',
    }),
    beds:  Joi.string().max(10).allow('', null),
    baths: Joi.string().max(10).allow('', null),
    price: Joi.string().max(50).allow('', null),
    notes: Joi.string().max(2000).allow('', null),
  }).required(),
});

const paymentOrderSchema = Joi.object({
  plan: Joi.string().valid('starter', 'agent_pro', 'brokerage').required(),
});

const paymentVerifySchema = Joi.object({
  razorpayOrderId:   Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
});

module.exports = {
  validate,
  validateSignup:        validate(signupSchema),
  validateLogin:         validate(loginSchema),
  validateGenerate:      validate(generateSchema),
  validatePaymentOrder:  validate(paymentOrderSchema),
  validatePaymentVerify: validate(paymentVerifySchema),
};
