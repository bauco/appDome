const express = require('express');

const router = express.Router();
const treeontroller = require('../controllers/tree');

router.post('/api/process-tree', treeontroller.createTree);

module.exports = router;
