const pdf = require('html-pdf');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
AWS.config.update('your s3 configurations');
const s3 = new AWS.S3();
const key = '$r%^&a!@u&^4^%5*n%$^&*i^%%@!%*k$';
const encryptor = require('simple-encryptor')(key);
const PDFDocument = require('pdfkit');
const pdftk = require('node-pdftk');
class asyncAwaitUse {
    async generatepdf(data){
        try {
            let userName = data.userName;
            let html = `<html><body><div> <p> hello ${userName} </p> </div></body></html>`;
            let createResult = pdf.create(html, { format: 'A4' });
            let pdfToBuffer = Promise.promisify(createResult.__proto__.toBuffer, { context: createResult }); //get pdf as buffer and uplaod to s3
            let bufferResult = await pdfToBuffer();
            this.uplaodToS3(bufferResult)   // put to s3 bbucket
        } catch (error) {
            console.log(error) // handle error
        }
    }
    
    async uplaodToS3(buffer){
        try {       
            let keyName = this.randomString(15, '9876543210abcdegxyz'); // first params for string length 
            encryptedPass = encryptor.encrypt(keyName); // encrypt the keyName
            let setObject = await s3.putObject({ Bucket: 'your bucket name', Key: keyName, Body: buffer }).promise();
            console.log(setObject);   
            this.getS3Object(setObject.Key); // Get s3 file buffer
        } catch (error) {
            console.log(error);
        }
    }

    async randomString(length, chars) { // generate random string
        let result = '';
        for (var i = length; i > 0;i--) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    }

    async getSignedUrl(keyName){
        let fileUrl = await s3.getSignedUrl('getObject', { Bucket: 'your bucket name', Key: keyName, Expires: 15 * 60 * 100 }).promise();
        return fileUrl 
    }

    async getS3Object(keyName){
        try {
            let setParams = { Bucket: 'your s3 bucket name', Key: keyName }
            let data = await s3.getObject(setParams).promise();
            if(data.Body) return { bufferData: data.Body };
        } catch (error) {
          console.log(error); // handle error error
        }
    }

    async imagesToPdf (data){   // Convert images to pdf and write it to buffer
        try{
            let fileUrl = this.getSignedUrl(data)
            let html = `<html>
                        <body>
                            <div style='width: 100%'>
                            <img src="`+fileUrl+`" />
                            </div>
                        </body>
                        </html>`
            let createResult = pdf.create(html, { format: 'A4' });
            let pdfToBuffer = Promise.promisify(createResult.__proto__.toBuffer, { context: createResult });
            let bufferResult = await pdfToBuffer();
            return bufferResult;
          }catch(error){
            return console.log(error) 
        }
    }

    async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array)
        }
    }

    async combineMultipleImagesToPdf (fileLocation, keyNames) {
        try {
            // pass keyNames as array of s3 keyname string
            let doc = new PDFDocument 
            doc.pipe(fs.createWriteStream(fileLocation)); // location for output file 
            await this.asyncForEach(keyNames, async (item, idx) => { // .map() can be used 
              let imageObj = await this.getS3Object(item);
              if (idx === 0) { 
                doc.fontSize(25).text().moveDown().image(imageObj.Body, { width: 400, align: 'center', valign: 'center'});
              } else { 
                doc.addPage().fontSize(25).text().moveDown().image(imageObj.Body, { width: 400, align: 'center', valign: 'center' });
              }
            });
            doc.end();
          } catch (error) {
            console.log(error) // handle error 
          }
    }
// dataFiles pass this as an array of string of your s3 object & outputPath as a destination 
    async combinePfds (dataFiles, outputPath){
        try {
          await pdftk.input(dataFiles).output(outputPath);
          console.log("Combined Two PDF's");
        } catch (error) {
            console.log(error)
        }
      }
}
let myClass = new asyncAwaitUse();
module.exports = myClass