const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ margin: 40, size: 'A4' });
const outputPath = path.join(__dirname, '..', 'Documentation', 'Bohloko_Test_Users.pdf');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Colors
const primary = '#2E7D32';
const headerBg = '#2E7D32';
const headerText = '#FFFFFF';
const altRow = '#F1F8E9';
const borderColor = '#A5D6A7';

// Title
doc.fontSize(22).fillColor(primary).font('Helvetica-Bold').text('Bohloko Family Farm', { align: 'center' });
doc.fontSize(14).fillColor('#555').font('Helvetica').text('Poultry Processing System — Test Users', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(9).fillColor('#888').text(`Generated: ${new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' });
doc.moveDown(1);

// Table data
const users = [
  { id: 1, name: 'Thabo Bohloko', email: 'admin@bohlokofarm.co.za', password: 'Admin@123', type: 'Staff', role: 'Farm Manager', status: 'approved' },
  { id: 2, name: 'John Doe', email: 'john@bohlokofarm.co.za', password: 'Staff@123', type: 'Staff', role: 'Poultry Attendant', status: 'approved' },
  { id: 3, name: 'Sarah Mokoena', email: 'sarah@bohlokofarm.co.za', password: 'Staff@123', type: 'Staff', role: 'Production Supervisor', status: 'approved' },
  { id: 4, name: 'Jane Smith', email: 'jane@example.com', password: 'Consumer@123', type: 'Consumer', role: 'Customer', status: 'approved' },
  { id: 5, name: 'David Nkosi', email: 'david@example.com', password: 'Consumer@123', type: 'Consumer', role: 'Customer', status: 'approved' },
  { id: 6, name: 'Maria Garcia', email: 'maria@spicekitchen.co.za', password: 'Restaurant@123', type: 'Restaurant', role: 'Customer', status: 'approved' },
  { id: 7, name: 'Pieter Van Der Berg', email: 'pieter@greenstore.co.za', password: 'Retailer@123', type: 'Retailer', role: 'Customer', status: 'approved' },
  { id: 8, name: 'Nomsa Dlamini', email: 'nomsa@freshdistribute.co.za', password: 'Distributor@123', type: 'Distributor', role: 'Customer', status: 'approved' },
  { id: 9, name: 'Admin School', email: 'admin@brightschool.edu.za', password: 'Institution@123', type: 'Institution', role: 'Customer', status: 'approved' },
  { id: 10, name: 'Alex Johnson', email: 'alex@example.com', password: 'Pending@123', type: 'Consumer', role: 'Customer', status: 'pending' },
];

const headers = ['#', 'Name', 'Email', 'Password', 'Type', 'Role', 'Status'];
const colWidths = [25, 90, 130, 90, 65, 105, 50];
const startX = 40;
const rowHeight = 22;
const headerHeight = 26;

function drawHeader() {
  let x = startX;
  const y = doc.y;
  doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), headerHeight).fill(headerBg);
  headers.forEach((h, i) => {
    doc.fontSize(8).fillColor(headerText).font('Helvetica-Bold').text(h, x + 4, y + 8, { width: colWidths[i] - 8 });
    x += colWidths[i];
  });
  doc.y = y + headerHeight;
}

function drawRow(user, idx) {
  let x = startX;
  const y = doc.y;
  const bgColor = idx % 2 === 0 ? '#FFFFFF' : altRow;

  doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(bgColor);

  const values = [
    String(user.id),
    user.name,
    user.email,
    user.password,
    user.type,
    user.role,
    user.status === 'pending' ? 'PENDING' : user.status,
  ];

  values.forEach((v, i) => {
    let fill = '#333';
    if (i === 6 && user.status === 'pending') fill = '#E65100';
    doc.fontSize(7.5).fillColor(fill).font(i === 6 ? 'Helvetica-Bold' : 'Helvetica').text(v, x + 4, y + 6, { width: colWidths[i] - 8 });
    x += colWidths[i];
  });

  doc.y = y + rowHeight;
}

// Draw table
drawHeader();
users.forEach((u, i) => {
  if (doc.y > 750) {
    doc.addPage();
    doc.y = 40;
  }
  drawRow(u, i);
});

// Border around table
doc.rect(startX, headerHeight + 40, colWidths.reduce((a, b) => a + b, 0), headerHeight + rowHeight * users.length)
   .lineWidth(0.5).stroke(borderColor);

// Footer
doc.moveDown(2);
doc.fontSize(8).fillColor('#888').font('Helvetica')
   .text('Notes:', { underline: true });
doc.fontSize(8).fillColor('#555')
   .text('• Admin (Thabo) has full access to all modules including analytics and user management.')
   .text('• Staff users (John, Sarah) can manage production, inventory, and orders.')
   .text('• Consumer/Restaurant/Retailer/Distributor/Institution users can browse products, place orders, and track deliveries.')
   .text('• Alex Johnson is the only PENDING user — requires admin approval before login.')
   .text('• Production URL: https://bohlokopoultryproject.onrender.com');

doc.moveDown(1);
doc.fontSize(7).fillColor('#AAA').text('CONFIDENTIAL — For testing purposes only', { align: 'center' });

doc.end();
stream.on('finish', () => {
  console.log('PDF generated:', outputPath);
});
