const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const subjectsCourses = require('../controllers/subjectsCoursesController');
const subjectsProfessors = require('../controllers/subjectsProfessorsController');
const schools = require('../controllers/schoolController');
const classrooms = require('../controllers/classroomController');
const people = require('../controllers/peopleController');

// --- Subjects ↔ Courses
router.get('/subjects-courses', auth, subjectsCourses.getAllSubjectsCourses);
router.post('/subjects-courses', auth, subjectsCourses.assignSubjectToCourse);
router.delete('/subjects-courses/:id', auth, subjectsCourses.removeSubjectFromCourse);

// --- Subjects ↔ Professors
router.get('/subjects-professors', auth, subjectsProfessors.getAllSubjectsProfessors);
router.post('/subjects-professors', auth, subjectsProfessors.assignProfessorToSubject);
router.delete('/subjects-professors/:id', auth, subjectsProfessors.removeProfessorFromSubject);

// --- Courses ↔ Professors
router.get('/courses-professors/', auth, subjectsProfessors.getCourseByProfessorId);

// BACKOFFICE SCHOOLS
router.get('/schools', auth, schools.getAllSchools);
router.get('/schools/:id', auth, schools.getSchoolById);
router.post('/schools', auth, schools.createSchool);
router.put('/schools/:id', auth, schools.updateSchool);
router.delete('/schools/:id', auth, schools.deleteSchool);

// BACKOFFICE CLASSROOMS
router.get('/classrooms', auth, classrooms.getAllClassrooms);
router.get('/classrooms/:id', auth, classrooms.getClassroomById);
router.post('/classrooms', auth, classrooms.createClassroom);
router.put('/classrooms/:id', auth, classrooms.updateClassroom);
router.delete('/classrooms/:id', auth, classrooms.deleteClassroom);

// BACKOFFICE PEOPLE
router.get('/people', auth, people.getAllPeople);
router.get('/people/:id', auth, people.getPersonById);
router.post('/people', auth, people.createPerson);
router.put('/people/:id', auth, people.updatePerson);
router.delete('/people/:id', auth, people.deletePerson);

module.exports = router;
