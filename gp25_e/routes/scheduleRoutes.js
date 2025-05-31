const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, scheduleController.getAllSchedules);
router.get('/:id', auth, scheduleController.getScheduleById);
router.get('/user/me', auth, scheduleController.getUserSchedules);
router.post('/', auth, scheduleController.createSchedule);
router.put('/:id', auth, scheduleController.updateSchedule);
router.delete('/:id', auth, scheduleController.deleteSchedule);

// Blocks
router.post('/:id/blocks', auth, scheduleController.addBlock); // Adicionar bloco a calendário
router.delete('/blocks/:blockId', auth, scheduleController.deleteBlock); // Apagar bloco

// Blocks conflicts
router.post('/:id/check-block-conflict', auth, scheduleController.checkBlockConflict);

module.exports = router;
