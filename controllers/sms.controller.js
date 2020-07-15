var mongoose = require('mongoose');
const soapRequest = require('easy-soap-request');
const utf8 = require('utf8');
const uuidv1 = require('uuid/v1');
const uuidv4 = require('uuid/v4');
var xml2js       = require('xml2js');
var xmlParser       = new xml2js.Parser();
var fs = require('fs');
var path = require('path');
var moment = require('moment');
const axios = require('axios');
const JSONs = require('circular-json');
const md5 = require('md5');
const random = require('random');

function sendSms(mobileNumber, message)
{
    const url = process.env.SMS_URL;
    const headers = {
    'user-agent': 'CS-SMS-DISPATCHER',
    'Content-Type': 'text/xml;charset=UTF-8',
    'soapAction': process.env.SMS_URL,
    };

    const sendData = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://www.huawei.com.cn/schema/common/v2_1"  xmlns:loc="http://www.csapi.org/schema/parlayx/sms/send/v2_2/local"> <soapenv:Header> <v2:RequestSOAPHeader> <spId>601420</spId> <spPassword>d25a1dff4d9f69caed238b15cf3b8add</spPassword> <serviceId>6014202000132216</serviceId> <timeStamp>20190907</timeStamp><v2:OA>tel:254726504166</v2:OA><v2:FA>tel:254726504166</v2:FA></v2:RequestSOAPHeader></soapenv:Header><soapenv:Body><loc:sendSms><loc:addresses>tel:254726504166</loc:addresses><loc:senderName>703813</loc:senderName> <loc:message>08/27,(CR)KES 6500.00;08/27,(DR)KES 6450.00;08/27,(DR)KES 31.60;08/21,(CR)KES 1.00;08/21,(CR)KES 5510.00;08/21,(DR)KES 5509.56;08/19,(DR)KES 56.97;08/13,(DR)KES 2900.00;08/13,(DR)KES 31.60;07/22,(DR)KES 1500.00;</loc:message><loc:receiptRequest> <endpoint>http://10.241.1.65:4238/SDP/notifyservice.php</endpoint> <interfaceName>SmsNotification</interfaceName> <correlator>2019090716373639ed7973b0</correlator> </loc:receiptRequest></loc:sendSms> </soapenv:Body> </soapenv:Envelope>';
    const xml = utf8.encode(sendData);

    // usage of module
    (async () => {
    const { response } = await soapRequest(url, headers, xml, 100000); // Optional timeout parameter(milliseconds)
    const { body, statusCode } = response;
    console.log(body);
    console.log(statusCode);
    })();

    return "SMS has been sent";
}

function sendSmsFaker(mobileNumber, message, uniqueID, fileID)
{
    let dateObject = new Date();
    var spId = "601420";
    var password = "Qzs!10948$Hpm";
    var serviceId = "6014202000132216"; //1b51008ba1bb700dc2365498fc0515ac
    var timestamp = dateObject.getFullYear() + "" + ("0" + (dateObject.getMonth() + 1)).slice(-2) + "-" + ("0" + dateObject.getDate()).slice(-2);
    var correlator_end = md5(random.int(0, 10)).substr(0,10);
    var correlator = timestamp+""+dateObject.getHours()+""+dateObject.getMinutes()+""+dateObject.getSeconds()+ correlator_end;
    correlator = correlator.replace("-","");
    var authentication_ = "81df9a66b21b8b809cb4dfa814646050";
    var authentication = md5(spId+password+timestamp);
    writeToFile("====== PASSWORD ========\r\n");
    writeToFile(authentication);

    //const url = 'http://172.17.20.34:26000/SMSTest/TestSMS.asmx';
    const url = 'http://192.168.9.177:8310/SendSmsService/services/SendSms';
    const headers = {
    'user-agent': 'CS-SMS-DISPATCHER',
    'Content-Type': 'text/xml;charset=UTF-8',
    };

    //const sendData = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soapenv:Header/><soapenv:Body><tem:AddSafaricomSMSTest><tem:MobileNumber>'+ mobileNumber +'</tem:MobileNumber><tem:SMSText>'+ message +'</tem:SMSText><tem:UniqueID>'+ uniqueID +'</tem:UniqueID><tem:FileID>'+ fileID +'</tem:FileID></tem:AddSafaricomSMSTest></soapenv:Body></soapenv:Envelope>';
    const sendData = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://www.huawei.com.cn/schema/common/v2_1"  xmlns:loc="http://www.csapi.org/schema/parlayx/sms/send/v2_2/local"> <soapenv:Header> <v2:RequestSOAPHeader> <spId>'+ spId +'</spId> <spPassword>'+ authentication +'</spPassword> <serviceId>'+ serviceId +'</serviceId> <timeStamp>'+ timestamp +'</timeStamp><v2:OA>tel:'+ mobileNumber +'</v2:OA><v2:FA>tel:'+ mobileNumber +'</v2:FA></v2:RequestSOAPHeader></soapenv:Header><soapenv:Body><loc:sendSms><loc:addresses>tel:'+ mobileNumber +'</loc:addresses><loc:senderName>703813</loc:senderName> <loc:message>'+ message +'</loc:message><loc:receiptRequest> <endpoint>http://10.241.1.65:4238/SDP/notifyservice.php</endpoint> <interfaceName>SmsNotification</interfaceName> <correlator>'+ correlator +'</correlator> </loc:receiptRequest></loc:sendSms> </soapenv:Body> </soapenv:Envelope>';
    const xml = utf8.encode(sendData);

    // usage of module
    (async () => {
    const { response } = await soapRequest(url, headers, xml,100000).catch(()=>{
        updateStatusOnDb("FAILED", uniqueID, smsStatus);
    }); // Optional timeout parameter(milliseconds)
    const { body, statusCode } = response;
    console.log(body);
    //console.log(statusCode);
    var smsStatus = "";
    xmlParser.parseString(body, (err, result) => {
        smsStatus = result;
        if(statusCode == "200"){
            smsStatus =  result['soapenv:Envelope']['soapenv:Body'][0]['ns1:sendSmsResponse'][0]['ns1:result'][0];
        }else{
            smsStatus = statusCode;
        }

    });
        //Update Status
    await updateStatusOnDb("SENT", uniqueID, smsStatus);

    })();

    return "SMS has been sent";
}

function updateStatusOnDb(sentStatus, uniqueID, smsStatus){
    return new Promise((resolve, reject) => {
    var SMS = mongoose.model("SMS");
        var sentTime = moment().format('yyyy-mm-dd:hh:mm:ss');
        if(mongoose.Types.ObjectId.isValid(uniqueID)) {
            SMS.findByIdAndUpdate(uniqueID,{$set:{is_sent:sentStatus,status:smsStatus,sent_at:sentTime}},{new:true})       
            .then((docs)=>{
               if(docs) {
                   console.log("Updated");
                 resolve({success:true,data:docs});
               } else {
                 reject({success:false,data:"no such user exist"});
               }
            }).catch((err)=>{
                console.log(err);
                //reject(err);
            })
            } else {
              reject({success:"false",data:"provide correct key"});
            }
        });
}


function store(mobileNumber, message, uniqueID)
{
    return new Promise(resolve => {
        var mobileNumber = mobileNumber;
        var message = message;
        var uniqueID = uniqueID;
        var status = null;
        
        mongoose.model('SMS').create({
            mobile_number : mobileNumber,
            sms_text : message,
            unique_id : uniqueID,
            status : status
        }, function(err, resp){
            if(err){
                //console.log({'status' : '091', 'data' : 'There was a problem adding session details', 'Details' : err});
            }else{
                //console.log({'status' : '000', 'data' : 'Session data successfully Logged'});
                resolve("Session data successfully Logged")
                //console.log({'status' : '000', 'data' : 'Session data successfully Logged'});
            }
        })
    });
}

exports.sendSMS = function(req, res){
    sendSms("254726504166", "Sample Message");
};

exports.readXml = function(req, res)
{
    var xml = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><AddSafaricomSMSTestResponse xmlns="http://tempuri.org/"><AddSafaricomSMSTestResult>000</AddSafaricomSMSTestResult></AddSafaricomSMSTestResponse></soap:Body></soap:Envelope>';
    var response = xmlParser.parseString(xml, (err, result) => {
        return result['soap:Envelope']['soap:Body'][0]['AddSafaricomSMSTestResponse'][0]['AddSafaricomSMSTestResult'][0];
    });

}

exports.getSmsToSend = function(req, res)
{
    waiting();
}

exports.readFile = (req, res) => {
  var fileName = req.body.sms_file
  var fileID = req.body.sms_file_id
  var uploadType = req.body.upload_type;
  var sms_text = req.body.sms_text;
  var summaryDetails = "";
  var summary = "";
  console.log("FILENAME : "+ fileName);
  new Promise((resolve, reject) => {
    //fs.readFile(path.join(__dirname, 'data', 'C:\\SMS\\FileUploads\\'+fileName), 'utf8', (err, data) => {
    fs.readFile('C:\\SMS\\FileUploads\\'+fileName, 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }

      var smsData = [];
      var linedata = data.split('\n');
      var rowdata = linedata.map(row => row.split('\t'));
      var num = 0

      let dateObject = new Date();
      var currentDateTime = dateObject.getFullYear() + "-" + ("0" + (dateObject.getMonth() + 1)).slice(-2) + "-" + ("0" + dateObject.getDate()).slice(-2) + " " + dateObject.getHours() + 
                            ":" + dateObject.getMinutes() + ":" + dateObject.getSeconds() + " " + dateObject.getMilliseconds();

      linedata.forEach(ld => {
            //console.log(ld);
            var rowdata = ld.split('\t');
            //console.log(rowdata[0] + "|" + rowdata[1] +"|"+rowdata[2]);
            var shortMessage = ""
            if(uploadType == "1"){
                shortMessage = sms_text;
            }else{
                shortMessage = rowdata[1];
            }
            
            console.log("inserting");
            var sm = {
                "mobile_number" : rowdata[0].trim(),
                "sms_text" : shortMessage,
                "unique_id" : rowdata[2],
                "is_sent" : "PENDING",
                "created_at" : currentDateTime,
                "status" : null,
                "sent_at" : null,
                "file_name" : fileName
            };

            smsData.push(sm);
      });
      console.log(smsData);
      //Insert into db

      var SMS = mongoose.model('SMS');

      SMS.collection.insertMany(smsData, function(err, docs){
            if(err){
                console.log("There was an error adding data");
            }else{
                console.log(docs.insertedCount+" documents inserted");
                //Send notification on complete upload and Start processing SMSes
                new Promise((resolve, reject) => {
                    axios.post('http://172.17.20.27:51106/FileUploadWebApi/api/bulksms/InsertCompleted', {
                        FileID: fileID,
                        SummaryDetails: docs.insertedCount+" documents uploaded"
                    })
                    .then((res) => {
                    console.log(`statusCode: ${res.statusCode}`)
                    //console.log(res)
                    writeToFile("============ SEND EMAIL OF UPLOADED DATA=============");
                    writeToFile(res);
                    })
                    .catch((error) => {
                    console.error(error)
                    });
                    resolve(true);
                }).then((data, err) => {
                    //new Promise((resolve, reject) => {
                       (async () => {
                            var SMS =  mongoose.model('SMS');
                            var stream = SMS.collection.find({file_name:fileName}).stream();
                            stream.on('data', function(doc) {
                                //console.log(doc._id);
                                (async () => {
                                    await sendSmsFaker(doc.mobile_number, doc.sms_text, doc._id);
                                })();
                            });
                            stream.on('error', function(err) {
                                console.log(err);
                            });
                            stream.on('end', function() {
                                console.log("END");
                                //Send Notification after message has been sent
                                writeToFile(" ==== SENDING COMPLETE ======\n");
                                //resolve(true);
                                //Final
                                
                            });

                            

                       })()

                       (async () => {
                            var summary = await getSMSSentSummary(fileName).then(() => {
                                var notification = sendFinalNotification(fileID, summary);
                            });
                            
                        })();
                        
                    }).then((data, err) => {
                        /*(async () => {
                            var summary = await getSMSSentSummary(fileName).then(() => {
                                var notification = sendFinalNotification(fileID, summary);
                            });
                             
                        })();*/
                        
                    //});
                    
                });
            }
      })

      console.log("Records uploaded " + num);
      summaryDetails = "Records uploaded " + num;
      resolve(data.split('\n').map(row => row.split('\t')));

    });
})
    res.send("Data has been received for processing.");

}

exports.readJSON = (req, res) => {
    var jsonResponse = req.body.sms
    var jsonContent = JSON.parse(jsonResponse);
        console.log(Object.keys(jsonContent).length)
        jsonContent.forEach(content => {
            console.log(content['MobileNumber'], content['SMSText'], content['UniqueID']);
            //store(content['MobileNumber'], content['SMSText'], content['UniqueID']);
        });
}


exports.uploadFile = (req, res) => {
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send('No files were uploaded.');
      }
    
      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      let sampleFile = req.files.sampleFile;
    
      // Use the mv() method to place the file somewhere on your server
      sampleFile.mv('/somewhere/on/your/server/filename.jpg', function(err) {
        if (err)
          return res.status(500).send(err);
    
        res.send('File uploaded!');
      });
}

exports.readAll = (req, res) => {
    var fileName = req.body.sms_file;
    var SMS =  mongoose.model('SMS');
    var stream = SMS.collection.find({file_name:fileName}).stream();
    stream.on('data', function(doc) {
        //console.log(doc._id);
        sendSmsFaker(doc.mobile_number, doc.sms_text, doc._id);
    });
    stream.on('error', function(err) {
        console.log(err);
    });
    stream.on('end', function() {
        console.log('All done!');
    });
}

exports.summary = function getSMSSentSummary(req, res)
{
    var summary = "";
    //return new Promise(resolve => {
        var SMS =  mongoose.model('SMS');
        //var summary = SMS.collection.aggregate([ {$match:{file_name: fileName}}, { $group: { _id:{is_sent:"$is_sent",status:"$status"}, sum:{ $sum:1}  } } ]);
        (async () => {
        var total_sent = "";
		var total_processed = "";
		var total_success = "";
		var total_failed = "";
		var total_pending = "";
        total_sent = await SMS.collection.countDocuments({is_sent:"SENT"});

        total_processed = await SMS.collection.countDocuments({is_sent:"SENT"})

        total_success = await SMS.collection.countDocuments({is_sent:"SENT", status:"000"})

        total_failed = await SMS.collection.countDocuments({is_sent:"SENT", status:"091"})
        total_pending = await SMS.collection.countDocuments({is_sent:"PENDING"});

        summary = "{"+
                "total_sent:"+total_sent+""+
                "total_processed:"+total_processed+""+
                "total_success:"+total_success+""+
                "total_failed:"+total_failed+""+
                "total_pending:"+total_pending+""+
        "}";

        console.log(summary);
        res.send(summary);
    })();
       /* resolve(summary);
        res.send(summary);
    })*/
    
}

function sendFinalNotification(fileID, summary){
    return new Promise(resolve => {
        console.log("SUMMARY " + summary);
        axios.post('http://172.17.20.34:26000/BulkSMSMiddleware/api/bulksms/SendingCompleted', {
            FileID: fileID,
            SummaryDetails: summary
        })
        .then((res) => {
        console.log(`statusCode: ${res.statusCode}`)
        console.log(res)
        writeToFile("============================== SENDING FINAL SMS===================");
        writeToFile(res);
        })
        .catch((error) => {
        console.error(error)
        writeToFile("============================== ERROR SENDING FINAL SMS===================");
        writeToFile(error);
        });
        resolve("NOTIFICATION SENT");
    })    
}

exports.sendPending = (req, res) => {
    (async () => {
        var SMS =  mongoose.model('SMS');
        var stream = SMS.collection.find({is_sent:"PENDING"}).stream();
        stream.on('data', function(doc) {
            //console.log(doc._id);
            (async () => {
                await sendSmsFaker(doc.mobile_number, doc.sms_text, doc._id);
            })();
        });
        stream.on('error', function(err) {
            console.log(err);
        });
        stream.on('end', function() {
            console.log("END");
            console.log("SENDING COMPLETE");
            //Send Notification after message has been sent
            //writeToFile(" ==== SENDING COMPLETE ======\n");
            //resolve(true);
            //Final
            
        });

   })()
}

function writeToFile(data)
{
    fs.appendFile('./logs/logs.txt', data+"'\r\n", function (err) {
        if (err) throw err;
        console.log('Saved!');
      });
}