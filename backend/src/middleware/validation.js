import { body, param, query, validationResult } from 'express-validator';

/**
 * Run validation and return errors if any.
 * Use this as the last item in a validation chain.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

// ─── Auth Validators ─────────────────────────────────────────────────────────

export const validateSignup = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name must be 50 characters or less'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name must be 50 characters or less'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  body('gender')
    .notEmpty().withMessage('Gender is required')
    .toLowerCase() // <--- FIX: Automatically changes "Female" to "female"
    .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    // <--- FIX: Removed strict ISO8601 to allow standard React date strings
    .custom((value) => {
      const dob = new Date(value);
      if (isNaN(dob.getTime())) throw new Error('Enter a valid date');
      
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) throw new Error('You must be at least 18 years old');
      if (age > 100) throw new Error('Invalid date of birth');
      return true;
    }),
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Profile Validators ───────────────────────────────────────────────────────

export const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio must be 500 characters or less'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City must be 100 characters or less'),
  body('height')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Height must be 20 characters or less'),
  body('religion')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Religion must be 50 characters or less'),
  body('occupation')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Occupation must be 100 characters or less'),
  body('education')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Education must be 100 characters or less'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone().withMessage('Enter a valid phone number'),
];

// ─── Message Validators ───────────────────────────────────────────────────────

export const validateSendMessage = [
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ max: 2000 }).withMessage('Message must be 2000 characters or less'),
];

// ─── Report Validators ────────────────────────────────────────────────────────

export const validateReport = [
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isIn(['spam', 'inappropriate', 'fake_profile', 'harassment', 'other'])
    .withMessage('Invalid reason'),
  body('details')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Details must be 500 characters or less'),
];

// ─── Common Validators ────────────────────────────────────────────────────────

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    .toInt(),
];

export const validateUserId = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isString().withMessage('Invalid user ID'),
];