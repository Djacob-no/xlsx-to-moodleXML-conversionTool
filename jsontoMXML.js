/********
 * Created by daniel.jacobsen@nov.com 
*********/


const { Console } = require("console");
const fs = require("fs");
const hbs = require("handlebars");
//const jsondata = require("./dataModules/ExcelData.js");
const mpcbuf = fs.readFileSync("templates/mc_question.hbs"); //read question template
const tfbuf = fs.readFileSync("templates/tf_question.hbs"); //read question template
const numQTemplate = fs.readFileSync("templates/numerical_question.hbs"); //read question template
const txtQTemplate = fs.readFileSync("templates/text_question.hbs"); //read question template
const abuf = fs.readFileSync("templates/answer.hbs"); // read answer template
const numAnswerTemplate = fs.readFileSync("templates/answer_numerical.hbs"); // read numericalanswer template
hbs.registerPartial("answer", abuf.toString('utf-8')); //registering answer 
hbs.registerPartial("numAnswer", numAnswerTemplate.toString('utf-8')); //registering answer 
const mcpQuestion = hbs.compile(mpcbuf.toString('utf-8')); //compiling multiplechoise questions
const tfQuestion = hbs.compile(tfbuf.toString('utf-8')); //compiling truefalse questions
const NumQuestion = hbs.compile(numQTemplate.toString('utf-8')); //compiling truefalse questions
const txtQuestion = hbs.compile(txtQTemplate.toString('utf-8')); //compiling truefalse questions
let pdfpath = "http://idstest.nov.com/mec0attachments/"; //path to the pdfs attachments



//function for appending webpath and attachment to the question text
/*function attachmentHandler(questiontxt, attachmentname) {
    //const alink = '<a target="_blank" style="color:red; text-decoration:underline" href="' + pdfpath + attachmentname + '">' + attachmentname + '</a> <br> ' + questiontxt;
    //return alink;
    
}*/
function attachmentHandler(questionTxt, resourceTxt) {
    //console.log("resourceTxt");
    //return questionTxt
    let qtxt = "";
    if (resourceTxt) {
        if (resourceTxt.indexOf(".pdf") != -1 || resourceTxt.indexOf(".jpg") != -1 || resourceTxt.indexOf(".png") != -1) {
            if (resourceTxt.indexOf(",")) {
                let resourceTxtArray = resourceTxt.split(",");
                for (let j = 0; j < resourceTxtArray.length; j++) {
                    qtxt += htmlinputs(resourceTxtArray[j].trim())
                }
                qtxt += questionTxt;
            } else {
                qtxt = htmlinputs(resourceTxt) + questionTxt;
            }

        } else qtxt = "problem";
       
        return qtxt;
    } else return questionTxt



    function htmlinputs(attachmentname) {
        let link = "";
        console.log("resourceName == "+ attachmentname);
        if (attachmentname.indexOf(".pdf") != -1) {
            const alink = '<a target="_blank" style="color:red; text-decoration:underline" href="' + pdfpath + attachmentname + '">' + attachmentname + '</a> <br> ';
            link = alink;
        }
        if (attachmentname.indexOf(".jpg")  != -1 || attachmentname.indexOf(".png")  != -1) {
            const alink = '<img src="' + pdfpath + attachmentname + '" width="500"> <br>';
            link = alink;
        }
        console.log("returned LINK is == "+ link);
        return link;
    }

}

function convertJSONtoMXML(jsondata, rURL) {
    //check last character of resource url if its not / then append a / to the end
    if(rURL){
    if (rURL.slice(-1) != "/"){
        pdfpath = rURL + "/";
    }else{pdfpath = rURL;}
    }else{return "error no resource url"}

    console.log("resource URL = "+ pdfpath);
    //questiontypes extracted
    let multipleChoice = [];
    let trueFalse = [];
    let multipleSelect = [];
    //let draanddrop = [];
    let numberInput = [];
    let textInput =[];
    let problemQuestions = [];

    let mc_data = ""; //used to write final xml output into
    let ms_data = ""; //used to write final xml output into
    let tf_data = ""; //used to write final xml output into
    let num_data = "";
    let text_data = "";

    const QB = jsondata; //selects the questionbank sheet 

    //sort out the question types into their own arrays
    for (i = 0; i < QB.length; i++) {
        let qtxt = QB[i]["Question Text"];
        if(qtxt){
            qtxt = qtxt.replace(/&/g,"&amp;"); //replaces special characters with HTML escaped characters to avoid handlebars problems
            qtxt = qtxt.replace(/</g,"&lt;");
            qtxt = qtxt.replace(/>/g,"&gt;");
            qtxt = qtxt.replace(/"/g,"&quot;");
            qtxt = qtxt.replace(/'/g,"&#39;");
            QB[i]["Question Text"] = qtxt;
            //console.log("qTXT Replaced"  + QB[i]["Question Text"])
        }
        switch (QB[i]["Question Type"].toLowerCase()) {
            case "drag and drop":
                draanddrop.push(QB[i]);
                break;

            case "multiple choice":
                multipleChoice.push(QB[i]);
                break;

            case "multiple response":
                multipleSelect.push(QB[i]);
                break;

            case "true / false":
                trueFalse.push(QB[i]);
                break;

            case "text input":
                textInput.push(QB[i]);
                break;

            case "number input":
                numberInput.push(QB[i]);
                break;

            default:
                if(QB[i]["Question Type"]){
                    problemQuestions.push(QB[i]);
                }
        }
    }
   

     // Handle Text input questions
     for (i = 0; i < textInput.length; i++) {

        let answerarray = []; //define array where we keep all our accepted answers

        if(textInput[i]["Correct Answer"] != "" && textInput[i]["Correct Answer"].length > 1){
            answerarray.push({fractionPercent: "100", answerTxt: textInput[i]["Correct Answer"]}); // add the correct answer column to the answer array
        }else{
            problemQuestions.push(textInput[i]);
            continue;
        }
        
    
        //add all the rest of the accepted answers to the correct answer array
        for(j=1;j<8;j++){
            let acceptedAnswer = textInput[i]["Answer Alternative "+j];
            if(acceptedAnswer){ //if the answer alternative column is not empty
                answerarray.push({
                    fractionPercent: "100",
                    answerTxt: acceptedAnswer
                });
            }
        }

        //handle attachments to the question
        let qtxt = attachmentHandler(textInput[i]["Question Text"], textInput[i]["Resources"]);
        if(qtxt === "problem"){
            console.log("problem with resource, no supported resource found yet there is something here")
            problemQuestions.push(textInput[i]);
            continue; //skips the question and send it to the error questions
        }
        
            

        //make data concat all text questions using the xml template
        let formattedAnswer = {
            questionID: textInput[i]["Question ID"],
            topic: textInput[i]["Topic"],
            subtopic: textInput[i]["Subtopic"],
            questionTxt: qtxt,
            answers: answerarray
        }
       
        text_data += txtQuestion(formattedAnswer);
        //console.log(" formatted answer on text question = " + text_data);
    }

    // Handle Number input Questions
    for(i = 0; i < numberInput.length; i++){

        //error handling if correct answe is not just a number
        if(isNaN(numberInput[i]["Correct Answer"])){
            console.log("answer is not a number");
            problemQuestions.push(numberInput[i]);
            continue;
        }


        let qtxt =  attachmentHandler(numberInput[i]["Question Text"], numberInput[i]["Resources"]);
        let corans = {fractionPercent: "100", answerTxt: numberInput[i]["Correct Answer"]};

        //handle attachments to the question
            if(qtxt === "problem"){
                console.log("problem with resource, no supported resource found yet there is something here")
                problemQuestions.push(numberInput[i]);
                continue; //skips the question and send it to the error questions
            }
        
        
        //make data concat all number questions using the xml template
        let formattedAnswer = {
            questionID: numberInput[i]["Question ID"],
            topic: numberInput[i]["Topic"],
            subtopic: numberInput[i]["Subtopic"],
            questionTxt: qtxt,
            numAnswers: corans
        }
        num_data += NumQuestion(formattedAnswer);
    }

    //handle multiplechoice array 
    for (i = 0; i < multipleChoice.length; i++) {
        let correctanswer = "";
        ca = multipleChoice[i]["Correct Answer"];

        //removes problematic questions
        if (ca) {
             correctanswer = Number(ca.replace(/\W|\s/g, '')) // remove blank spaces from string
            if (isNaN(correctanswer) || correctanswer > 7 ) {
                console.log("correct answe is Not a number or number is greater than 7");
                problemQuestions.push(multipleChoice[i]); //if correct answer is longer than 1 character eg. A)B) removes the question and puts it into problemquestions
                continue;
            }
        } else {
            problemQuestions.push(multipleChoice[i]); //if correct answer is not defined question is put in problemquestion array
            continue;
        }
        

        //Section for fixing the answer alternatives of  multiple choice 
        let aaarray = [];
        for(j=1;j<8;j++){
            let acceptedAnswer = multipleChoice[i]["Answer Alternative "+j];
            if(acceptedAnswer){
                aaarray.push({
                    fractionPercent: "0",
                    answerTxt: acceptedAnswer
                });
            }else{
                //dev should hit undefined if nothing is in the answer alternative column. can be removed after testing
                //console.log("err accepted answer = (should be undefined)" + acceptedAnswer);
            }
        }

        
      
        //find the correct answer and set it to give 100% score
        if(aaarray[correctanswer-1]){
            aaarray[correctanswer-1].fractionPercent = "100";
        }else{
            problemQuestions.push(multipleChoice[i]); //someone put in a number for correct answer larger than they have amount of answers
                continue;
        }


        //handle attachments to the question
        let qtxt = attachmentHandler(multipleChoice[i]["Question Text"], multipleChoice[i]["Resources"]);
      
            if(qtxt === "problem"){
                console.log("problem with resource, no supported resource found yet there is something here")
                problemQuestions.push(multipleChoice[i]);
                continue; //skips the question and send it to the error questions
            }
        


        //make data concat all multiplechoice questions using the xml template
        let formattedAnswer = {
            questionID: multipleChoice[i]["Question ID"],
            topic: multipleChoice[i]["Topic"],
            subtopic: multipleChoice[i]["Subtopic"],
            questionTxt: qtxt,
            singleAnswer: "true",
            answers: aaarray
        };
        
        mc_data += mcpQuestion(formattedAnswer);
    }

    //handle multipleselect array 
    for (i = 0; i < multipleSelect.length; i++) {
        let cas = multipleSelect[i]["Correct Answer"];

        //removes problematic questions
        if (cas) {
            let cora = cas.replace(/\s/g, ''); // remove blank spaces from string
            if(cora.indexOf(")") == -1){
                problemQuestions.push(multipleSelect[i]);
                console.log("correct answer missing or wrongly formatted" + JSON.stringify(multipleSelect[i])); //error log wich question does not have question alternatives
                continue;
            }
            let correctanswer = cora.split(")");
            if(correctanswer[correctanswer.length-1] == ""){
                correctanswer.splice(-1, 1);
            }

            //error handling for loop 
            let isErr = false;
            for(j=0;j<correctanswer.length;j++){
               if(isNaN(Number(correctanswer[j])) || correctanswer[j] =="" ){
                isErr = true; 
               }
            }
            if(isErr){
                problemQuestions.push(multipleSelect[i])
                console.log("one of the correct answers is not a number")
                continue;
            }
            cas = correctanswer;
            //console.log("the amount of correct answers is = "+correctanswer);
        }else {
            problemQuestions.push(multipleSelect[i]);
            console.log("correct answer missing " + JSON.stringify(multipleSelect[i])); //error log wich question does not have question alternatives
            continue;
        }


        //loop 7 times and store the answer alternatives in alternative answer array(aaarray) and set all to give 0 score
        let aaarray = [];
        for(j=1;j<8;j++){
            let acceptedAnswer = multipleSelect[i]["Answer Alternative "+j];
            if(acceptedAnswer){ //if is not empty
                aaarray.push({
                    fractionPercent: "0",
                    answerTxt: acceptedAnswer
                });
            }
        }



        let fractionDivided = parseFloat(100 / cas.length).toFixed(5);//create a % based of how many correct answers there are.
        for (j = 0; j < aaarray.length; j++) { //loop answer array
            aaarray[j]["fractionPercent"] = parseFloat(fractionDivided*-1).toFixed(5); //sets all to -% unless they are overridden in the block below

            for(h=0;h<cas.length;h++){ //loop correct answer array eg. (2,4,5)
                if(Number(cas[h]) === Number(j+1)){  //this gets confusing fast. If the correct answer number corresponds to the alternate answer column number
                    aaarray[j]["fractionPercent"] = fractionDivided; //sets the correct fraction on the correct answer in answer answer alternative array
                }
            }
            
        }
       
         //handle attachments to the question
         let qtxt = attachmentHandler(multipleSelect[i]["Question Text"], multipleSelect[i]["Resources"]);
        
            if(qtxt === "problem"){
                console.log("problem with resource, no supported resource found yet there is something here")
                problemQuestions.push(multipleSelect[i]);
                continue; //skips the question and send it to the error questions
            }
        
 
       
        //if its just a single answer. turn the question into a multiple choice question
        let SA = "false";
        if(cas.length == 1){SA = "true"};
        //make data concat all multiplechoice questions using the xml template
        let formattedAnswer = {
            questionID: multipleSelect[i]["Question ID"],
            topic: multipleSelect[i]["Topic"],
            subtopic: multipleSelect[i]["Subtopic"],
            questionTxt: qtxt,
            singleAnswer: SA,
            answers: aaarray
        }

        ms_data += mcpQuestion(formattedAnswer);
    }

    // Handle true false questions
    for (i = 0; i < trueFalse.length; i++) {

        let corans = trueFalse[i]["Correct Answer"];
        let answerarray = [];

        //error handling
        switch(corans) {
            case "TRUE":
              break;
            case "FALSE":
              break;
            default:
              problemQuestions.push(trueFalse[i]) // something other than TRUE or FALSE detected, sending to problem question
              continue;
          }



        if (corans == "TRUE") {
            answerarray.push({
                fractionPercent: "100",
                answerTxt: "true"
            });
            answerarray.push({
                fractionPercent: "0",
                answerTxt: "false"
            });
        } else {
            answerarray.push({
                fractionPercent: "0",
                answerTxt: "true"
            });
            answerarray.push({
                fractionPercent: "100",
                answerTxt: "false"
            });
        }

        //handle attachments to the question
        let qtxt = attachmentHandler(trueFalse[i]["Question Text"], trueFalse[i]["Resources"]);
        if(qtxt === "problem"){
            console.log("problem with resource, no supported resource found yet there is something here")
            problemQuestions.push(trueFalse[i]);
            continue; //skips the question and send it to the error questions
        }

        //make data concat all tf questions using the xml template
        let formattedAnswer = {
            questionID: trueFalse[i]["Question ID"],
            topic: trueFalse[i]["Topic"],
            subtopic: trueFalse[i]["Subtopic"],
            questionTxt: qtxt,
            answers: answerarray
        }
        tf_data += tfQuestion(formattedAnswer);
    }


    //loops problemquestion array and displays errors. 
    let problemtxt = "";
    problemtxt += "There are " + problemQuestions.length + " questions causing problems that have been removed <br>";
    if (problemQuestions.length > 0) {
        for (i = 0; i < problemQuestions.length; i++) {
            problemtxt += "Question ID = " + problemQuestions[i]["Question ID"] +" is causing trouble <br>";
        }
    }




    //Uncomment to write the data to files overwriting any files already outputed
    const xmltxt = '<?xml version="1.0" encoding="UTF-8"?><quiz>';
    const endquiz = '</quiz>';
    //console.log(text_data +"tatjglerøgjaøelrk");
    let finalXMLOutput = problemtxt +"****"+  xmltxt + ms_data + num_data + text_data + mc_data + tf_data + endquiz;
    //let finalXMLOutput = problemtxt +"****"+ JSON.stringify(problemQuestions);
    return finalXMLOutput;

    /*/console.log(""+ xmltxt + ms_data + endquiz +"");
    fs.writeFile("Output/ms.xml", "" + xmltxt + ms_data + endquiz+"", (err) => { 
        if (err) 
          console.log(err); 
        else { 
          console.log("File written successfully\n"); 
          //console.log("The written has the following contents:"); 
          //console.log(fs.readFileSync("books.txt", "utf8")); 
        } 
      }); 
      

    fs.writeFile("Output/mc.xml", ""+xmltxt + mc_data + endquiz+"", (err) => { 
        if (err) 
          console.log(err); 
        else { 
          console.log("File written successfully\n"); 
          //console.log("The written has the following contents:"); 
          //console.log(fs.readFileSync("books.txt", "utf8")); 
        } 
      }); 
     
      fs.writeFile("Output/tf.xml", ""+ xmltxt + tf_data + endquiz +"", (err) => { 
        if (err) 
          console.log(err); 
        else { 
          console.log("File written successfully\n"); 
          //console.log("The written has the following contents:"); 
          //console.log(fs.readFileSync("books.txt", "utf8")); 
        } 
      }); */

}

module.exports.convertJSONtoMXML = convertJSONtoMXML;