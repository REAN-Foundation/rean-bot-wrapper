import { Logger } from "../../common/logger";
import fs from 'fs';
import path from 'path';
import pDFDocument from 'pdfkit';

export const generatePdfCertificate = async (donorName, date) => {
    try {
        const doc = new pDFDocument();
        const pdfFilePath = path.join(process.cwd(), `uploads/blood_warriors/${donorName}_${Date.now()}_certificate.pdf`);

        // Define colors
        const secondaryColor = '#E74C3C'; // Red
        const textColor = '#333'; // Dark Gray

        // Define fonts (you can add your own fonts)
        const titleFont = 'Helvetica-Bold';
        const textFont = 'Helvetica';
        const instagramLink = 'https://www.instagram.com/bwindia_/';
        const logoImage = path.join(process.cwd(), "./src/assets/images/instagram_logo.png");

        const linkdinLink = 'https://www.linkedin.com/company/bloodwarriors/';
        const linkdinImage = path.join(process.cwd(), "./src/assets/images/linkdin_logo.png");

        // Pipe the PDF document to a writable stream (in this case, a file)
        const stream = fs.createWriteStream(pdfFilePath);
        doc.pipe(stream);

        // Add a colorful background
        doc.rect(0, 0, 612, 792) // Letter-size page
            .fillColor('white')
            .fill();

        // Add a border to the certificate
        doc.rect(20, 20, 572, 752)
            .lineWidth(4)
            .strokeColor(secondaryColor)
            .stroke();

        // Define the certificate content
        const msgPart1 = "Dear ";
        const certificateContent1 = `                This is to confirm that your donation on `;
        const donationDate = `${new Date(date).toDateString()} `;
        const certificateContent2 = `is successfully recorded. As a token of gratitude, we are sharing this certificate of appreciation, in recognition of your selfless act of donating blood to save lives. Your generosity and compassion have made a significant difference in our community.

Thank you for your contribution to the cause of saving lives through blood donation.

Forever Grateful,
`;

        // Add content to the PDF
        doc.fillColor(textColor)
            .font(titleFont)
            .fontSize(28)
            .text('Certificate of Appreciation', { align: 'center', underline: true })
            .image( path.join(process.cwd(), "./src/assets/images/blood_warrior_logo.jpg"),  50, 40, { width: 80 });

        doc.moveDown(1);

        doc.font(textFont)
            .fontSize(15)
            .text(msgPart1, { continued: true })
            .font('Helvetica-Bold')
            .fontSize(15)
            .text(donorName);

        doc.moveDown(1);

        doc.font(textFont)
            .fontSize(15)
            .text(certificateContent1, {
                align     : 'justify',
                width     : 470, // Adjusted width of text block
                indent    : 0, // Left margin
                lineGap   : 10, // Line spacing
                continued : true
            });

        doc.font('Helvetica-Bold')
            .fontSize(15)
            .text(donationDate, {
                align     : 'justify',
                width     : 470, // Adjusted width of text block
                indent    : 0, // Left margin
                lineGap   : 10, // Line spacing
                continued : true
            });

        doc.font(textFont)
            .fontSize(14)
            .text(certificateContent2, {
                align   : 'justify',
                width   : 470, // Adjusted width of text block
                indent  : 0, // Left margin
                lineGap : 10 // Line spacing
            });

        doc.font('Helvetica-Bold')
            .fontSize(15)
            .text("Team Blood Warriors", {
                align   : 'left',
                width   : 470, // Adjusted width of text block
                indent  : 0, // Left margin
                lineGap : 10 // Line spacing
            });
        doc.font(textFont)
            .fontSize(15)
            .text("Follow us on:", {
                align   : 'left',
                width   : 470, // Adjusted width of text block
                indent  : 0, // Left margin
                lineGap : 10 // Line spacing
            })
            .image(logoImage, 165, 460, { width: 25, height: 25 })
            .link(165, 460, 25, 25, instagramLink)
            .image(linkdinImage, 195, 460, { width: 25, height: 25 })
            .link(195, 460, 25, 25, linkdinLink);

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
