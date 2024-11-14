const express = require('express');

const router = express.Router();
const treeontroller = require('../controllers/tree');

router.post('/api/process-tree', treeontroller.createTree);
router.get('/api/process-tree', treeontroller.getTree);
module.exports = router;
