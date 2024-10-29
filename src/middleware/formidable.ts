import { Request, Response, NextFunction } from 'express';
import formidable, { Fields, Files } from 'formidable';
import { ExtendedRequest } from "../types/postInterfaces";

// interface ExtendedRequest extends Request {
//   files: any;
// }

export const fileparser = async (req: Request, res: Response, next: NextFunction) => {
  const form = formidable();

  form.parse(req, (err, fields: Fields, files: Files) => {
    if (err) {
      return next(err);
    }

    console.log('Parsed fields:', fields); 
    console.log('Parsed files:', files);
    
    if (!req.body) req.body = {};

    for (let key in fields) {
      const value = fields[key];
      if (value) req.body[key] = Array.isArray(value) ? value[0] : value;
    }

    if (!(req as ExtendedRequest).files) (req as ExtendedRequest).files = {};
    for (let key in files) {
      const value = files[key];
      if (value) {
        (req as ExtendedRequest).files[key] = value; 
      }
    }

    next();
  });
};

