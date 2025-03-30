DROP DATABASE IF EXISTS gp25_dev;

-- Create the database
CREATE DATABASE IF NOT EXISTS gp25_dev;

-- Use the database
USE gp25_dev;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idIpt VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    isDocente BOOLEAN DEFAULT FALSE,
    idUnidepart INT DEFAULT NULL,
    idCategoria INT DEFAULT NULL,

    CONSTRAINT chk_docente_atributos CHECK (
        (isDocente = TRUE AND idUnidepart IS NOT NULL AND idCategoria IS NOT NULL)
        OR
        (isDocente = FALSE AND idUnidepart IS NULL AND idCategoria IS NULL)
    )
);
