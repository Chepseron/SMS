var express = require('express');
var smsController = require('../controllers/sms.controller');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/sendSample/', smsController.sendSMS);
//router.get('/sendDummy/', smsController.sendDummySms);
router.post('/file', smsController.readFile);
router.post('/sms_data', smsController.readJSON);
router.post('/send_sms', smsController.readAll);
router.get('/summary', smsController.summary);
router.post('/send_pending', smsController.sendPending);

module.exports = router;