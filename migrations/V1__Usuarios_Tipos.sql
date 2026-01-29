-- Active: 1769035941104@@localhost@5433@SENA
CREATE TABLE roles (
    id_rol VARCHAR(10) PRIMARY KEY,        
    nombre VARCHAR(50) NOT NULL UNIQUE,
    prefijo CHAR(2) NOT NULL               
);

INSERT INTO roles (id_rol, nombre, prefijo)
VALUES ('A', 'Administrador', 'A'),
       ('E', 'Empleado', 'E'),
       ('C', 'Cliente', 'C');

CREATE TABLE usuarios (
    id_usuario VARCHAR(10) PRIMARY KEY,       
    nombre VARCHAR(100) NOT NULL,
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100),
    id_rol VARCHAR(10) NOT NULL REFERENCES roles(id_rol)
);

CREATE SEQUENCE seq_admin START 1;
CREATE SEQUENCE seq_empleado START 1;
CREATE SEQUENCE seq_cliente START 1;

CREATE OR REPLACE FUNCTION generar_id_usuario()
RETURNS TRIGGER AS $$
DECLARE
    next_id INT;
    nuevo_id VARCHAR(10);
BEGIN
    IF NEW.id_rol = 'A' THEN
        next_id := nextval('seq_admin');
        nuevo_id := 'A' || LPAD(next_id::text, 4, '0');
    ELSIF NEW.id_rol = 'E' THEN
        next_id := nextval('seq_empleado');
        nuevo_id := 'E' || LPAD(next_id::text, 4, '0');
    ELSIF NEW.id_rol = 'C' THEN
        next_id := nextval('seq_cliente');
        nuevo_id := 'C' || LPAD(next_id::text, 4, '0');
    ELSE
        RAISE EXCEPTION 'Rol no soportado: %', NEW.id_rol;
    END IF;

    NEW.id_usuario := nuevo_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_id_usuario
BEFORE INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION generar_id_usuario();

CREATE TABLE credenciales (
    id_credencial SERIAL PRIMARY KEY,
    id_rol VARCHAR(10) NOT NULL REFERENCES roles(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_usuario VARCHAR(10) NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL 
);