import { captureShema } from '../schemas/screenshot.schema.js';

const validateCaptureRequest = (req, res, next) => {
  const { error } = captureShema.safeParse(req.body);
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};

export default validateCaptureRequest;
