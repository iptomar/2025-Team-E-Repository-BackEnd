INSERT INTO SubjectsProfessors (SubjectFK, PeopleFK, CreatedBy, CreatedOn)
VALUES
  (11, 2, 'admin@gp25.dev', NOW()),
  (18, 2, 'admin@gp25.dev', NOW()),
  (24, 2, 'admin@gp25.dev', NOW()),
  (4, 3, 'admin@gp25.dev', NOW()),
  (24, 2, 'admin@gp25.dev', NOW());


INSERT INTO ProfessorsCourses (PeopleFK, CourseFK)
SELECT DISTINCT 
  sp.PeopleFK,
  sc.CourseId
FROM SubjectsProfessors sp
JOIN Subjects s ON s.Id = sp.SubjectFK
JOIN SubjectsCourses sc ON sp.SubjectFK = sc.SubjectFK;