import { z } from 'zod';

// Reglas
const reName = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]{2,60}$/;
const reLast = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,25}$/;
const rePass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ @$!%*?&.#-]).{8,64}$/;
const roles = ['A','E','C'];

const norm = (s) => (typeof s === 'string' ? s.trim() : s);

// Registro
export const registerSchema = z.object({
  nombre: z.string().regex(reName, 'Nombre inválido').transform(norm),
  primer_apellido: z.string().regex(reLast, 'Primer apellido inválido').transform(norm),
  segundo_apellido: z
    .string()
    .regex(reLast, 'Segundo apellido inválido').transform(norm),
  id_rol: z.enum(roles, { message: 'Rol inválido' }),
  correo: z.string().email('Correo inválido').max(120).transform((s) => norm(s)?.toLowerCase()),
  contrasena: z.string().regex(rePass, 'Contraseña insegura'),
});

// Login
export const loginSchema = z.object({
  username: z.string().email('Correo inválido').max(120).transform((s) => norm(s)?.toLowerCase()),
  password: z.string().min(8).max(64),
});

// Inscripciones
export const inscripcionCreateSchema = z.object({
  nombre: z.string().regex(reName, 'Nombre inválido').transform(norm),
  primer_apellido: z.string().regex(reLast, 'Primer apellido inválido').transform(norm),
  segundo_apellido: z.string().optional().transform((s) => (s ? norm(s) : undefined)),
  correo: z.string().email('Correo inválido').max(255).transform((s) => norm(s)?.toLowerCase()),
  telefono: z.string().max(50).optional().transform((s) => (s ? norm(s) : undefined)),
  empresa: z.string().max(255).optional().transform((s) => (s ? norm(s) : undefined)),
  cargo: z.string().max(255).optional().transform((s) => (s ? norm(s) : undefined)),
  area_id: z.number().int().positive().optional(),
  subarea_id: z.number().int().positive().optional(),
  rama_id: z.number().int().positive().optional(),
  subrama_id: z.number().int().positive().optional(),
  difusion: z.string().max(100).optional().transform((s) => (s ? norm(s) : undefined)),
  tipo: z.enum(['evento', 'curso']),
  evento_id: z.number().int().positive().optional(),
  curso_id: z.number().int().positive().optional(),
});

export const inscripcionUpdateSchema = inscripcionCreateSchema.partial();

// Precios - Areas
export const precioAreaCreateSchema = z.object({
  areaId: z.number().int().positive().optional(),
  referencia: z.string().max(255).optional().transform(norm),
  anio: z.number().int().positive().optional(),
  descripcion: z.string().max(2000).optional().transform(norm),
  precio_unitario: z.number().nonnegative().optional(),
  precio_desc_13: z.number().nonnegative().optional(),
  precio_ensayo_bilateral: z.number().nonnegative().optional(),
  precio_desc_16: z.number().nonnegative().optional(),
  precio_desc_19: z.number().nonnegative().optional(),
  precio_usd: z.number().nonnegative().optional(),
  precio_usd_desc_19: z.number().nonnegative().optional()
});

export const precioAreaUpdateSchema = precioAreaCreateSchema.partial();

// Precios - Ramas
export const precioRamaCreateSchema = z.object({
  ramaId: z.number().int().positive().optional(),
  referencia: z.string().max(255).optional().transform(norm),
  anio: z.number().int().positive().optional(),
  descripcion: z.string().max(2000).optional().transform(norm),
  precio_unitario: z.number().nonnegative().optional(),
  precio_bilateral: z.number().nonnegative().optional(),
  precio_unitario_usd: z.number().nonnegative().optional()
});

export const precioRamaUpdateSchema = precioRamaCreateSchema.partial();

// Cotizaciones
export const cotizacionCreateSchema = z.object({
  usuarioId: z.string().min(1).max(64),
  nombre_cliente: z.string().max(255).transform(norm),
  correo: z.string().email('Correo inválido').max(255).transform((s) => norm(s)?.toLowerCase()),
  telefono: z.string().max(100),
  empresa: z.string().max(255).optional().transform((s) => (s ? norm(s) : undefined)),
  direccion: z.string().max(2000).optional().transform((s) => (s ? norm(s) : undefined)),
  notas: z.string().max(2000).optional().transform((s) => (s ? norm(s) : undefined)),
  vencimiento: z.string().optional(),
  items: z.array(z.union([
    z.object({ // catalog item
      tipo: z.enum(['area','rama']),
      precio_id: z.number().int().positive(),
      cantidad: z.number().int().positive()
    }),
    z.object({ // manual item
      tipo: z.literal('manual'),
      descripcion: z.string().max(2000).optional().transform((s) => (s ? norm(s) : undefined)),
      precioUnitario: z.number().nonnegative(),
      cantidad: z.number().int().positive()
    })
  ])).nonempty()
})
