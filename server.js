//source https://www.javatpoint.com/expressjs-file-upload 
var express = require('express');
var app = express();
var multer = require('multer');
var xlsxtojson = require("xlsx-to-json");
var xlstojson = require("xls-to-json");
app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Max-Age", "3600");
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    next();
});

// require jasontoxml Daniels script 
let JSONtoMXML = require('./jsontoMXML');
// configuration
app.use(express.static(__dirname + '/public'));               
app.use('/public/uploads',express.static(__dirname + '/public/uploads'));      


var storage = multer.diskStorage({
    
    destination: function (req, file, callback) {  
      callback(null, './uploads');  
    },  
    filename: function (req, file, callback) {  
      callback(null, file.originalname);  
    }  
  })
  var maxSize = 248000;
  var upload = multer({ storage : storage,limits: { fileSize: maxSize }}).single('fileup');  
  

 


//default Index page response
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
    //var pr = JSONtoMXML.convertJSONtoMXML("result");
})


app.post('/multer',function(req,res){  

    //var responseData;

    upload(req,res,function(err) {  
        if(err) {  
            return res.end("Error uploading file.");  
        } 

        //check what we are recieveing uploaded
        //console.log("req.body" +JSON.stringify(req.body.resourceURL));
        if(req.file){
            console.log(req.file.filename);
        }else{
            console.log("no filname found")
        }
        
        xlsxtojson({
            input: "./uploads/"+req.file.filename,  // input xls
            output: null, // output json
            lowerCaseHeaders:true
        }, function(err, result) {
            if(err) {
             res.json(err);
            } else {

                let promise = new Promise(function(resolve, reject) {
                    // the function is executed automatically when the promise is constructed
                   var pr = JSONtoMXML.convertJSONtoMXML(result, req.body.resourceURL);
                    // after 1 second signal that the job is done with the result "done"
                    resolve(pr);
                    //setTimeout(() => resolve(pr), 5000);
                  });

                  promise.then(
                    function(result){res.set('Content-Type', 'text/xml'); res.send(result)}, // shows "done!" after 1 second
                    function(error){res.send(error)} // doesn't run
                  );
            }
        });
    });  
    //res.send();
});  


/*/convert file to json
app.post('/api/xlstojson', function(req, res) {
    
    xlsxtojson({
        input: "./tokeep/Current.xlsx",  // input xls
        output: "output_deleteme_test.json", // output json
        lowerCaseHeaders:true
    }, function(err, result) {
        if(err) {
          res.json(err);
        } else {
          res.json(result);
        }
    });
});
*/
app.listen(3000,function(){  
    console.log("Server is running on port 3000");  
});  

