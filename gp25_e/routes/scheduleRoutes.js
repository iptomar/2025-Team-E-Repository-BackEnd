const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const blocksController = require('../controllers/blocksController');
const auth = require('../middleware/authMiddleware');

//Gets all blocks that are in a specific interval
router.get('/overlapping-blocks', blocksController.getOverlappingBlocks); 
// Blocks conflicts
router.post('/check-block-conflict', auth, scheduleController.checkBlockConflict);

router.get('/', auth, scheduleController.getAllSchedules);
router.get('/:id', auth, scheduleController.getScheduleById);
router.get('/user/me', auth, scheduleController.getUserSchedules);
router.post('/', auth, scheduleController.createSchedule);
router.put('/:id', auth, scheduleController.updateSchedule);
router.delete('/:id', auth, scheduleController.deleteSchedule);

// Blocks
router.post('/:id/blocks', auth, scheduleController.addBlock); // Adicionar bloco a calendário
router.delete('/blocks/:blockId', auth, scheduleController.deleteBlock); // Apagar bloco

module.exports = router;
