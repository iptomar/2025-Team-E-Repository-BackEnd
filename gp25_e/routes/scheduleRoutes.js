const express           = require('express');
const router            = express.Router();

const scheduleController = require('../controllers/scheduleController');
const blocksController   = require('../controllers/blocksController');
const coursesController  = require('../controllers/coursesController'); 

const auth = require('../middleware/authMiddleware');

/* ---------- Blocos (overlaps & conflitcs) ---------- */
router.get('/overlapping-blocks', blocksController.getOverlappingBlocks);
router.post('/check-block-conflict', auth, scheduleController.checkBlockConflict);

/* ---------- Schedules ---------- */
router.get('/',          auth, scheduleController.getAllSchedules);

/*  🆕 Rotas específicas do utilizador (colocadas ANTES de /:id)  */
router.get('/user/courses', auth, coursesController.getUserCourses);
router.get('/user/me',      auth, scheduleController.getUserSchedules);

router.get('/:id',   auth, scheduleController.getScheduleById);
router.post('/',     auth, scheduleController.createSchedule);
router.put('/:id',   auth, scheduleController.updateSchedule);
router.delete('/:id',auth, scheduleController.deleteSchedule);

/* ---------- Blocos dentro de um horário ---------- */
router.post('/:id/blocks',      auth, scheduleController.addBlock);     // adicionar bloco
router.delete('/blocks/:blockId', auth, scheduleController.deleteBlock);// apagar bloco

module.exports = router;
