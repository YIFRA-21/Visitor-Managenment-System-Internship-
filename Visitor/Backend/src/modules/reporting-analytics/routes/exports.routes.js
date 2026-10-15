const { Router } = require('express');
const router = Router();

router.get('/ping', (req, res) => res.json({ message: 'Exports route stub' }));

module.exports = router;
