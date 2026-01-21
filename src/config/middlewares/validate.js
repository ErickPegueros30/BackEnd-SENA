// Archivo: src/config/middlewares/validate.js
// Funcionalidad: Middleware para validar datos de entrada usando Zod 
import {z, ZodError} from 'zod';

export const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse(req.body);
        req.body = parsed;
        next();
    }catch (error){
        if (error instanceof ZodError){
            const issues = error.issues.map(i => ({
                path: i.path.join('.'),
                message: i.message
            }));
            return res.status(400).json({ errors: issues });
        }
        return res.status(500).json({ message: 'Error de validación del servidor', error: error.message });
    }
};