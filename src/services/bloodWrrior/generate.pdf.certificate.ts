import { Logger } from "../../common/logger";
import fs from 'fs';
import path from 'path';
import pDFDocument from 'pdfkit';

export const generatePdfCertificate = async (donorName, date) => {
    try {

        // Create a document in landscape mode
        const doc = new pDFDocument({
            size   : [595.28, 841.89], // A4 in landscape (height * width)
            layout : 'landscape',
            margin : 30
        });
        const pdfFilePath = path.join(process.cwd(), `uploads/${donorName}_${Date.now()}_certificate.pdf`);

        // Pipe the PDF document to a writable stream (in this case, a file)
        const stream = fs.createWriteStream(pdfFilePath);
        doc.pipe(stream);

        // Set the background image on the left half
        doc.image(path.join(process.cwd(), "./src/assets/images/donation_certificate.jpg"), 0, 0, {
            width  : doc.page.width,
            height : doc.page.height
        });

        // Add recipient's name and donation date
        let donationDate = new Date(date).toDateString();
        donationDate = donationDate.replace(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*/, '');
        doc.fontSize(18)
            .fillColor('#FF005C')
            .font('Helvetica-Bold')
            .text(`${donorName} on ${donationDate}`, doc.page.width / 2 + 18, 200, {
                align : 'center',
                width : doc.page.width / 2 - 60
            });

        // Finalize the PDF document
        doc.end();

        // Listen for the 'finish' event to know when the PDF generation is complete
        stream.on('finish', () => {
            console.log(`Blood donation certificate created at ${pdfFilePath}`);
        });

        // Handle any errors
        stream.on('error', (err) => {
            console.error(`Error creating blood donation certificate: ${err}`);
        });

        return pdfFilePath;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Generate pdf error!');
        throw new Error("Risk assessment followup listener error");
    }
};
