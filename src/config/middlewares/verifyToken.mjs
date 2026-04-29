// Archivo: src/config/middlewares/verifyToken.mjs
// Funcionalidad: Middleware para verificar tokens JWT en solicitudes entrantes
// Uso: import verifyToken from './middlewares/verifyToken.mjs';
// Es funcional paara proteger rutas que requieren autenticación
import jwt from 'jsonwebtoken';

export default function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token)
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });

  jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_segura', (err, user) => {
    if (err)
      return res.status(403).json({ message: 'Token inválido.' });
    // Algunos tokens se firmaron con { user: {...} }; normalizamos a `req.user` para compatibilidad
    req.user = (user && user.user) ? user.user : user;
    next();
  });
}
    