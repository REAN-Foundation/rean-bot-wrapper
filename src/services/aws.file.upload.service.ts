import AWS from 'aws-sdk';
import fs from 'fs';
import nodeHtmlToImage from 'node-html-to-image';
const ID = process.env.ACCESS_KEY_ID;
const SECRET = process.env.ACCESS_KEY_SECRET;

const BUCKET_NAME = process.env.BUCKET_NAME;

export const uploadFile = (filePath) => {
    console.log('FILE UPLOAD STARTING', BUCKET_NAME, ID, SECRET);
    return new Promise(async (resolve, reject) => {

        // Read content from the file
        fs.stat(filePath, function (err) {
            if (err === null) {
                console.log('File exists');
                const fileContent = fs.readFileSync(filePath);
                var filename = filePath.replace(/^.*[\\/]/, '');

                // Setting up S3 upload parameters
                const params = {
                    Bucket        : BUCKET_NAME,
                    Key           : filename, // File name you want to save as in S3
                    Body          : fileContent,
                    'ContentType' : 'image/jpeg',
                    'ACL'         : 'public-read'
                };

                const s3 = new AWS.S3({
                    accessKeyId     : ID,
                    secretAccessKey : SECRET
                });

                // Uploading files to the bucket
                s3.upload(params, function (err, data) {
                    if (err) {
                        reject(err);
                    }
                    console.log(`File uploaded successfully. ${data}`);

                    resolve(data.Location);
                });
            } else if (err.code === 'ENOENT') {

                console.log('File not exists');
                reject('File not exists');
            } else {
                console.log('Some other error: ', err.code);
                reject(err.code);
            }
        });

    });
};

export const createFileFromHTML = (html) => {
    const imageName = 'uploads/' + Date.now() + '.png';

    const REANLogo = fs.readFileSync('./uploads/ReanLogo.jpg');
    const COWINLogo = fs.readFileSync('./uploads/COWINLogo.jpeg');

    const base64REANLogo = new (Buffer as any).from(REANLogo).toString('base64');
    const base64COWINLogo = new (Buffer as any).from(COWINLogo).toString('base64');
    const dataURIREAN = 'data:image/jpeg;base64,' + base64REANLogo;
    const dataURICOWIN = 'data:image/jpeg;base64,' + base64COWINLogo;
    return new Promise(async (resolve, reject) => {
        nodeHtmlToImage({
            output        : imageName,
            html          : html,
            content       : { imageSourceREAN: dataURIREAN, imageSourceCOWIN: dataURICOWIN },
            puppeteerArgs : { args: ['--no-sandbox'] }
        })
            .then(() => {
                console.log('file created');
                resolve(imageName);
            })
            .catch(async (error) => {
                console.log('file creation error', error);
                reject('');
            });
    });
};

