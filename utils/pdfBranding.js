const fs = require('fs');
const path = require('path');

function getLogoPath() {
  const candidates = [
    path.join(process.cwd(), 'public', 'images', 'logo', 'GAMELOOT LOGO TP.png'),
    path.join(process.cwd(), 'public', 'images', 'logo', 'GAMELOOT LOGO blue black.png'),
    path.join(process.cwd(), 'public', 'images', 'logo', 'GAMELOOT LOGO.png')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function drawBrandedPdfHeader(doc, { title = '' } = {}) {
  const left = doc.page.margins.left;
  const right = doc.page.margins.right;
  const usableWidth = doc.page.width - left - right;
  const top = 20;
  const logoBoxWidth = 118;
  const logoBoxHeight = 54;
  const logoPath = getLogoPath();

  doc.save();
  doc.roundedRect(left, top, logoBoxWidth, logoBoxHeight, 8).fill('#000000');

  if (logoPath) {
    try {
      doc.image(logoPath, left + 8, top + 6, {
        fit: [logoBoxWidth - 16, logoBoxHeight - 12],
        align: 'center',
        valign: 'center'
      });
    } catch (err) {
      // Ignore image parsing issues and keep the header usable.
    }
  }

  doc.restore();
  doc.fillColor('#111111')
    .font('Helvetica-Bold')
    .fontSize(20)
    .text('GameLootMalawi', left, top + 6, {
      width: usableWidth,
      align: 'center'
    });

  if (title) {
    doc.fillColor('#4f4f59')
      .font('Helvetica')
      .fontSize(10)
      .text(title, left, top + 30, {
        width: usableWidth,
        align: 'center'
      });
  }

  const dividerY = top + logoBoxHeight + 14;
  doc.moveTo(left, dividerY)
    .lineTo(doc.page.width - right, dividerY)
    .lineWidth(1)
    .strokeColor('#d8d8df')
    .stroke();

  doc.x = left;
  doc.y = dividerY + 14;
  doc.fillColor('#111111').font('Helvetica');
}

function applyBrandedPdfHeader(doc, options = {}) {
  const render = () => drawBrandedPdfHeader(doc, options);
  doc.on('pageAdded', render);
  render();
}

module.exports = {
  applyBrandedPdfHeader
};
