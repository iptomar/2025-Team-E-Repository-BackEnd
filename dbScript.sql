DROP DATABASE IF EXISTS gp25_prod;

-- Create the database
CREATE DATABASE IF NOT EXISTS gp25_prod;

-- Use the database
USE gp25_prod;

CREATE TABLE Institutions (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255),
    Abbreviation VARCHAR(50),
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME
);

CREATE TABLE Schools (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    IdSchool INT,
    Name VARCHAR(255),
    Abbreviation VARCHAR(50),
    InstitutionFK INT,
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME,
    FOREIGN KEY (InstitutionFK) REFERENCES Institutions(Id)
);

CREATE TABLE Classrooms (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255),
    SchoolFK INT,
    Allocation VARCHAR(100),
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME,
    FOREIGN KEY (SchoolFK) REFERENCES Schools(Id)
);

CREATE TABLE People (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    IdIpt INT,
    Name VARCHAR(100),
    Email VARCHAR(100),
    Title VARCHAR(100),
    Password VARCHAR(100),
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME
);

CREATE TABLE Roles (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100),
    Description TEXT,
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME
);

CREATE TABLE PeopleRoles (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    PeopleFK INT,
    RoleFK INT,
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME,
    FOREIGN KEY (PeopleFK) REFERENCES People(Id),
    FOREIGN KEY (RoleFK) REFERENCES Roles(Id)
);

CREATE TABLE Courses (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    IdCourse VARCHAR(10),
    Name VARCHAR(255),
    SchoolFK INT,
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME,
    FOREIGN KEY (SchoolFK) REFERENCES Schools(Id)
);

CREATE TABLE Subjects (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    IdSubject INT,
    Name VARCHAR(255),
    Description VARCHAR(1000),
    Tipologia ENUM('Teorica', 'Pratica', 'Teorico-Pratica'),
    HoursT INT,
    HoursTP INT,
    HoursP INT,
    TotalHours INT,
    CurricularYear VARCHAR(50),
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME
);

CREATE TABLE SubjectsProfessors (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    SubjectFK INT,
    PeopleFK INT,
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME,
    FOREIGN KEY (SubjectFK) REFERENCES Subjects(Id),
    FOREIGN KEY (PeopleFK) REFERENCES People(Id)
);

CREATE TABLE SubjectsCourses (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    SubjectFK INT,
    CourseId INT,
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME,
    FOREIGN KEY (SubjectFK) REFERENCES Subjects(Id),
    FOREIGN KEY (CourseId) REFERENCES Courses(Id)
);

CREATE TABLE Schedule (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    CourseId INT,
    Name VARCHAR(255),
    StartDate DATE,
    EndDate DATE,
    CurricularYear VARCHAR(50),
    Class VARCHAR(20),
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME,
    FOREIGN KEY (CourseId) REFERENCES Courses(Id)
);

CREATE TABLE Block (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    SubjectFK INT,
    StartHour TIME,
    EndHour TIME,
    DayOfWeek TINYINT,
    ScheduleFK INT,
    ClassroomFK INT,
    CreatedBy VARCHAR(100),
    CreatedOn DATETIME,
    UpdatedBy VARCHAR(100),
    UpdatedOn DATETIME,
    FOREIGN KEY (SubjectFK) REFERENCES Subjects(Id),
    FOREIGN KEY (ScheduleFK) REFERENCES Schedule(Id),
    FOREIGN KEY (ClassroomFK) REFERENCES Classrooms(Id),
    CHECK (DayOfWeek BETWEEN 1 AND 6)
);

CREATE TABLE ProfessorsCourses (
  PeopleFK INT NOT NULL,
  CourseFK INT NOT NULL,
  FOREIGN KEY (PeopleFK) REFERENCES People(Id),
  FOREIGN KEY (CourseFK) REFERENCES Courses(Id),
  PRIMARY KEY (PeopleFK,CourseFK)
);

INSERT INTO Roles (Name, Description, CreatedBy, CreatedOn)
VALUES 
  ('Admin', 'Administrador do sistema com acesso total.', 'admin@gp25.dev', NOW()),
  ('Docente', 'Professor responsável pelas disciplinas.', 'admin@gp25.dev', NOW()),
  ('Secretariado', 'Pessoal administrativo com acesso a gestão de horários e dados.', 'admin@gp25.dev', NOW());

-- Adicionar utilizador admin por defeito com password "123456"
INSERT INTO People (IdIpt, Name, Email, Title, Password, CreatedBy, CreatedOn)
VALUES (
  999999,
  'Administrador do Sistema',
  'admin@gp25.dev',
  'Administrador',
  -- Hash da password '123456' com bcrypt (custo 10)
  '$2b$10$JhUGo2p8ja59GHC0SuOnpOxipzT3AX7IjcmTr9iM7EbpIOsJGNOb.',
  'admin@gp25.dev',
  NOW()
);
INSERT INTO People (IdIpt, Name, Email, Title, Password, CreatedBy, CreatedOn)
VALUES (
  2,
  'Carlos Queiróz',
  'carloqrz@ipt.pt',
  'Assistente 2º Triénio',
  -- Hash da password '123456' com bcrypt (custo 10)
  '$2b$10$JhUGo2p8ja59GHC0SuOnpOxipzT3AX7IjcmTr9iM7EbpIOsJGNOb.',
  'admin@gp25.dev',
  NOW()
);
INSERT INTO People (IdIpt, Name, Email, Title, Password, CreatedBy, CreatedOn)
VALUES (
  3,
  'Teste',
  'teste@ipt.pt',
  'Docente',
  -- Hash da password '123456' com bcrypt (custo 10)
  '$2b$10$JhUGo2p8ja59GHC0SuOnpOxipzT3AX7IjcmTr9iM7EbpIOsJGNOb.',
  'admin@gp25.dev',
  NOW()
);

-- Associar utilizador admin à role Admin
INSERT INTO PeopleRoles (PeopleFK, RoleFK, CreatedBy, CreatedOn)
VALUES (
  1,  -- IdIpt do utilizador admin
  1,       -- Role Admin
  'admin@gp25.dev',
  NOW()
);

  
INSERT INTO Institutions (Name, Abbreviation, CreatedBy, CreatedOn)
VALUES ('Instituto Politécnico de Tomar', 'IPT', 'admin@gp25.dev', NOW());


INSERT INTO Schools (IdSchool, Name, Abbreviation, InstitutionFK, CreatedBy, CreatedOn)
VALUES
  (3243, 'Escola Superior de Tecnologia de Abrantes', 'ESTT', 1, 'admin@gp25.dev', NOW()),
  (3242, 'Escola Superior de Tecnologia de Tomar', 'ESGT', 1, 'admin@gp25.dev', NOW()),
  (3241, 'Escola Superior de Gestão de Tomar', 'ESTA', 1, 'admin@gp25.dev', NOW());
  
  
INSERT INTO Classrooms (Name, SchoolFK, Allocation, CreatedBy, CreatedOn)
VALUES 
  ('B255', 1, 'TMR', 'admin@gp25.dev', NOW()),
  ('B254', 1, 'TMR', 'admin@gp25.dev', NOW()),
  ('O106', 1, 'TMR', 'admin@gp25.dev', NOW()),
  ('O120', 1, 'TMR', 'admin@gp25.dev', NOW()),
  ('J120', 1, 'TMR', 'admin@gp25.dev', NOW()),
  ('B120', 1, 'TMR', 'admin@gp25.dev', NOW()),
  ('B126', 1, 'TMR', 'admin@gp25.dev', NOW()),
  ('I153', 1, 'TMR', 'admin@gp25.dev', NOW());
  
  
INSERT INTO Courses (IdCourse, Name, SchoolFK, CreatedBy, CreatedOn) VALUES ('9119', 'Engenharia Informática', 2, 'admin@gp25.dev', NOW());

INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (91192, "Álgebra", "", "Teorico-Pratica", 28, 42, 0, 75, 'admin@gp25.dev', NOW(), '1º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (91191, "Análise Matemática I", "", "Teorica", 28, 28, 14, 75, 'admin@gp25.dev', NOW(), '1º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (91193, "Introdução à Programação", "", "Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '1º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (91195, "Introdução à Tecnologia", "", "Teorico-Pratica", 0, 35, 35, 75, 'admin@gp25.dev', NOW(), '1º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (91194, "Sistemas Digitais", "", "Teorica", 28, 42, 0, 75, 'admin@gp25.dev', NOW(), '1º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (91196, "Análise Matemática II", "", "Teorico-Pratica", 28, 42, 0, 75, 'admin@gp25.dev', NOW(), '1º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (91198, "Introdução à Electrónica Digital", "", "Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '1º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (91197, "Lógica e Computação", "", "Teorico-Pratica", 28, 28, 14, 75, 'admin@gp25.dev', NOW(), '1º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (91199, "Programação Orientada a Objectos", "", "Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911910, "Tecnologias da Internet I", "", "Pratica", 0, 0, 70, 80, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911914, "Arquitectura de Computadores I", "", "Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911915, "Bases de Dados I", "", "Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911912, "Estruturas de Dados e Algoritmos", "", "Teorico-Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911913, "Introdução às Telecomunicações", "", "Teorico-Pratica", 0, 70, 0, 75, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911911, "Probabilidades e Estatística", "", "Teorico-Pratica", 28, 28, 14, 75, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911918, "Bases de Dados II", "", "Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911919, "Microprocessadores", "", "Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911917, "Redes de Dados I", "", "Teorico-Pratica", 0, 28, 42, 80, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911916, "Sistemas Operativos", "", "Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '3º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911920, "Tecnologias da Internet II", "", "Pratica", 0, 0, 70, 80, 'admin@gp25.dev', NOW(), '3º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911921, "Análise de Sistemas", "", "Teorico-Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '3º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911923, "Arquitectura de Computadores II", "", "Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '3º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911924, "Gestão e Segurança de Redes Informáticas", "", "Teorico-Pratica", 0, 28, 42, 80, 'admin@gp25.dev', NOW(), '3º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911922, "Redes de Dados II", "", "Teorico-Pratica", 0, 28, 42, 80, 'admin@gp25.dev', NOW(), '3º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911925, "Sistemas Distribuídos", "", "Pratica", 28, 0, 42, 80, 'admin@gp25.dev', NOW(), '3º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911926, "Empreendedorismo", "", "Teorica", 0, 70, 0, 70, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911928, "Projecto de Redes", "", "Teorico-Pratica", 0, 28, 28, 71, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911929, "Projecto de Sistemas de Informação", "", "Teorico-Pratica", 0, 28, 28, 71, 'admin@gp25.dev', NOW(), '2º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911930, "Projecto Final", "", "Teorico-Pratica", 0, 28, 28, 71, 'admin@gp25.dev', NOW(), '3º Ano');
INSERT INTO Subjects (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CreatedBy, CreatedOn, CurricularYear)
VALUES (911927, "Sistemas de Informação nas Organizações", "", "Teorico-Pratica", 0, 70, 0, 70, 'admin@gp25.dev', NOW(), '3º Ano');

INSERT INTO SubjectsCourses (SubjectFK, CourseId, CreatedBy, CreatedOn)
VALUES 
  (1, 1, 'admin@gp25.dev', NOW()),
  (2, 1, 'admin@gp25.dev', NOW()),
  (3, 1, 'admin@gp25.dev', NOW()),
  (4, 1, 'admin@gp25.dev', NOW()),
  (5, 1, 'admin@gp25.dev', NOW()),
  (6, 1, 'admin@gp25.dev', NOW()),
  (7, 1, 'admin@gp25.dev', NOW()),
  (8, 1, 'admin@gp25.dev', NOW()),
  (9, 1, 'admin@gp25.dev', NOW()),
  (10, 1, 'admin@gp25.dev', NOW()),
  (11, 1, 'admin@gp25.dev', NOW()),
  (12, 1, 'admin@gp25.dev', NOW()),
  (13, 1, 'admin@gp25.dev', NOW()),
  (14, 1, 'admin@gp25.dev', NOW()),
  (15, 1, 'admin@gp25.dev', NOW()),
  (16, 1, 'admin@gp25.dev', NOW()),
  (17, 1, 'admin@gp25.dev', NOW()),
  (18, 1, 'admin@gp25.dev', NOW()),
  (19, 1, 'admin@gp25.dev', NOW()),
  (20, 1, 'admin@gp25.dev', NOW()),
  (21, 1, 'admin@gp25.dev', NOW()),
  (22, 1, 'admin@gp25.dev', NOW()),
  (23, 1, 'admin@gp25.dev', NOW()),
  (24, 1, 'admin@gp25.dev', NOW()),
  (25, 1, 'admin@gp25.dev', NOW()),
  (26, 1, 'admin@gp25.dev', NOW()),
  (27, 1, 'admin@gp25.dev', NOW()),
  (28, 1, 'admin@gp25.dev', NOW()),
  (29, 1, 'admin@gp25.dev', NOW()),
  (30, 1, 'admin@gp25.dev', NOW());


-- Adicionar utilizador admin por defeito com password "123456"
INSERT INTO People (IdIpt, Name, Email, Title, Password, CreatedBy, CreatedOn)
VALUES (
  150,
  'Carlos Queiroz',
  'carloqrz@ipt.pt',
  'Assistente 2º Triénio',
  -- Hash da password '123456' com bcrypt (custo 10)
  '$2b$10$JhUGo2p8ja59GHC0SuOnpOxipzT3AX7IjcmTr9iM7EbpIOsJGNOb.',
  'admin@gp25.dev',
  NOW()
);

INSERT INTO PeopleRoles (PeopleFK, RoleFK, CreatedBy, CreatedOn)
VALUES (
  2,  -- IdIpt do utilizador
  2,       -- Role Docente
  'admin@gp25.dev',
  NOW()
);