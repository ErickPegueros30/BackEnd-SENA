import { z } from 'zod';

// Reglas
const reName = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]{2,60}$/;
const reLast = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,25}$/;
const rePass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ @$!%*?&.#-]).{8,64}$/;
const roles = ['A','AP','T','E','I','AL','J'];

const norm = (s) => (typeof s === 'string' ? s.trim() : s);

// Registro
export const registerSchema = z.object({
  nombre: z.string().regex(reName, 'Nombre inválido').transform(norm),
  primer_apellido: z.string().regex(reLast, 'Primer apellido inválido').transform(norm),
  segundo_apellido: z
    .string()
    .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{0,25}$/, 'Segundo apellido inválido')
    .transform(norm)
    .optional()
    .default(''),
  id_rol: z.enum(roles, { message: 'Rol inválido' }),
  correo: z.string().email('Correo inválido').max(120).transform((s) => norm(s)?.toLowerCase()),
  contrasena: z.string().regex(rePass, 'Contraseña insegura'),
});

// Login
export const loginSchema = z.object({
  username: z.string().email('Correo inválido').max(120).transform((s) => norm(s)?.toLowerCase()),
  password: z.string().min(8).max(64),
});