DROP DATABASE IF EXISTS gp25_dev;

-- Create the database
CREATE DATABASE IF NOT EXISTS gp25_dev;

-- Use the database
USE gp25_dev;

CREATE TABLE Institutions (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255),
    Abbreviation VARCHAR(50)
);

CREATE TABLE Schools (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255),
    Abbreviation VARCHAR(50),
    InstitutionFK INT,
    FOREIGN KEY (InstitutionFK) REFERENCES Institutions(Id)
);

CREATE TABLE Classrooms (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255),
    SchoolFK INT,
    Allocation VARCHAR(100),
    FOREIGN KEY (SchoolFK) REFERENCES Schools(Id)
);

CREATE TABLE People (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    Email VARCHAR(100),
    Title VARCHAR(100),
    Username VARCHAR(100),
    Password VARCHAR(100)
);

CREATE TABLE Roles (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100),
    Description TEXT
);

CREATE TABLE PeopleRoles (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    PeopleFK INT,
    RoleFK INT,
    FOREIGN KEY (PeopleFK) REFERENCES People(Id),
    FOREIGN KEY (RoleFK) REFERENCES Roles(Id)
);

CREATE TABLE Courses (
    Id VARCHAR(10) PRIMARY KEY,
    Name VARCHAR(255),
    SchoolFK INT,
    FOREIGN KEY (SchoolFK) REFERENCES Schools(Id)
);

CREATE TABLE Subjects (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255),
    Description TEXT,
    HoursT INT,
    HoursTP INT,
    HoursP INT,
    TotalHours INT
);

CREATE TABLE SubjectsProfessors (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    SubjectFK INT,
    PeopleFK INT,
    FOREIGN KEY (SubjectFK) REFERENCES Subjects(Id),
    FOREIGN KEY (PeopleFK) REFERENCES People(Id)
);

CREATE TABLE SubjectsCourses (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    SubjectFK INT,
    CourseId VARCHAR(10),
    FOREIGN KEY (SubjectFK) REFERENCES Subjects(Id),
    FOREIGN KEY (CourseId) REFERENCES Courses(Id)
);

CREATE TABLE Schedule (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    CourseId VARCHAR(10),
    Name VARCHAR(255),
    StartDate DATE,
    EndDate DATE,
    FOREIGN KEY (CourseId) REFERENCES Courses(Id)
);

CREATE TABLE Block (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    SubjectFK INT,
    StartHour TIME,
    EndHour TIME,
    ScheduleFK INT,
    FOREIGN KEY (SubjectFK) REFERENCES Subjects(Id),
    FOREIGN KEY (ScheduleFK) REFERENCES Schedule(Id)
);

INSERT INTO Roles (Name, Description)
VALUES 
  ('Admin', 'Administrador do sistema com acesso total.' ),
  ('Docente', 'Professor responsável pelas disciplinas.' ),
  ('Secretariado', 'Pessoal administrativo com acesso a gestão de horários e dados.');
  
INSERT INTO Institutions (Name, Abbreviation)
VALUES ('Instituto Politécnico de Tomar', 'IPT');

INSERT INTO Schools (Name, Abbreviation, InstitutionFK)
VALUES 
  ('Escola Superior de Tecnologia de Tomar', 'ESTT', 1),
  ('Escola Superior de Gestão de Tomar', 'ESGT', 1),
  ('Escola Superior de Tecnologia de Abrantes', 'ESTA', 1);
