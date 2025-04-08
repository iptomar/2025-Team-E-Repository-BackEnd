const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const subjectsCourses = require('../controllers/subjectsCoursesController');
const subjectsProfessors = require('../controllers/subjectsProfessorsController');

// --- Subjects ↔ Courses
router.get('/subjects-courses', auth, subjectsCourses.getAllSubjectsCourses);
router.post('/subjects-courses', auth, subjectsCourses.assignSubjectToCourse);
router.delete('/subjects-courses/:id', auth, subjectsCourses.removeSubjectFromCourse);

// --- Subjects ↔ Professors
router.get('/subjects-professors', auth, subjectsProfessors.getAllSubjectsProfessors);
router.post('/subjects-professors', auth, subjectsProfessors.assignProfessorToSubject);
router.delete('/subjects-professors/:id', auth, subjectsProfessors.removeProfessorFromSubject);

module.exports = router;
