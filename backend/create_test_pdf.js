const fs = require('fs');
const PDFDocument = require('pdfkit');

// Create a blank dummy pdf
const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('/tmp/dummy.pdf'));
doc.text('John Doe Resume\nCGPA: 8.5\nSkills: React, Node, SQL\n');
doc.end();

console.log('Dummy PDF created at /tmp/dummy.pdf for testing!');
