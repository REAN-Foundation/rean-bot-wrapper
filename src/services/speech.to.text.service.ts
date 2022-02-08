import http from 'https';
import path from 'path';
import speech from '@google-cloud/speech';
import fs from 'fs';

export class Speechtotext {

  SendSpeechRequest= async(fileUrl,chatServiceName) => {
      return new Promise((resolve, reject) => {
          if (chatServiceName === 'telegram'){
              http.get(fileUrl,(res) => {

                  //add time stamp - pending
                  const filename = path.basename(fileUrl);

                  // Image will be stored at this path
                  const uploadpath = `./audio/` + filename;
                  const filePath = fs.createWriteStream(uploadpath);
                  res.pipe(filePath);
                  filePath.on('finish',() => {
                      filePath.close();

                      main(uploadpath).catch(console.error);

                  });
              });
          } else if (chatServiceName === 'whatsapp'){
              console.log("enter whatsapp");
              main(fileUrl).catch(console.error);
          }

          async function main(uploadpath) {
              try {
                  const client = new speech.SpeechClient();
                  const file = fs.readFileSync(uploadpath);
                  console.log("upload Path,", uploadpath);
                  const audioBytes = file.toString('base64');

                  const audio = {
                      content : audioBytes,
                  };

                  const config = {
                      encoding                            : "OGG_OPUS",
                      sampleRateHertz                     : 16000,
                      languageCode                        : 'en-US',
                      enableSeparateRecognitionPerChannel : true,
                  };
                  let request = {};
                  request = {
                      audio  : audio,
                      config : config,
                  };

                  const [response] = await client.recognize(request);
                  console.log("response %O", response);
                  const transcription = response.results
                      .map(result => result.alternatives[0].transcript)
                      .join('\n');
                  resolve(transcription);
              } catch (error) {
                  reject(error);
              }
          }
      });
  }

}
