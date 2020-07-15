var mongoose = require('mongoose');
var dateTime = require('node-datetime');
var dt = dateTime.create();
var dateFormat = dt.format('Y-m-d H:M:S');

const smsSchema = new mongoose.Schema({
    mobile_number : String,
    sms_text : String,
    unique_id : String,
    is_sent : String,
    created_at : String,
    status : String,
    sent_at : String,
    file_name : String
});

mongoose.model('SMS', smsSchema);