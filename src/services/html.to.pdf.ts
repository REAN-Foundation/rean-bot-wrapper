/* eslint-disable @typescript-eslint/no-var-requires */
const pdf = require('html-pdf');
const fs = require('fs');

async function htmlToPDF(){
    const example = fs.readFileSync('./src/html.tables/example.html', 'utf8');
    const options = {
        format : 'Letter'
    };

    pdf.create(example, options).toFile('./pdf/test.pdf', (err, res) => {
        if (err) {
            console.log(err);
        }
    });
}

htmlToPDF();