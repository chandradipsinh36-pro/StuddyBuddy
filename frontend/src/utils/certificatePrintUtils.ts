import { jsPDF } from 'jspdf';
import type { CourseCertificate } from './certificateUtils';

/**
 * Helper to safely draw rounded rectangles on HTML5 canvas across all browsers.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

/**
 * Word wrap helper for canvas text to avoid overflow on long course titles.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Renders an ultra high-resolution (2970x2100 px, exact 10x A4 landscape ratio)
 * official certificate canvas with authentic typography, golden seals, and ornate borders.
 */
export function createCertificateCanvas(certificate: CourseCertificate): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // Exact 297mm x 210mm A4 landscape ratio (10 px per mm)
  canvas.width = 2970;
  canvas.height = 2100;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas 2D rendering context');
  }

  const w = canvas.width;
  const h = canvas.height;

  // 1. Premium Parchment Background
  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 200, w / 2, h / 2, 1900);
  bgGrad.addColorStop(0, '#ffffff');
  bgGrad.addColorStop(0.7, '#fefdfa');
  bgGrad.addColorStop(1, '#fbf7ee');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Ornate Double Gold Borders
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#b45309';
  ctx.strokeRect(50, 50, w - 100, h - 100);

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#d97706';
  ctx.strokeRect(74, 74, w - 148, h - 148);

  // Delicate filigree inner stroke
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#fde68a';
  ctx.strokeRect(88, 88, w - 176, h - 176);

  // Corner ornaments
  ctx.fillStyle = '#b45309';
  ctx.font = '48px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❖', 120, 120);
  ctx.fillText('❖', w - 120, 120);
  ctx.fillText('❖', 120, h - 120);
  ctx.fillText('❖', w - 120, h - 120);

  // 3. Top Header: StudyBuddy Branding & Verification Pill
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🎓 StudyBuddy', 140, 205);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('ACCREDITED PEER-TO-PEER LEARNING PLATFORM', 144, 245);

  // Verified Badge (top right)
  const badgeW = 620;
  const badgeH = 68;
  const badgeX = w - 140 - badgeW;
  const badgeY = 168;
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 34);
  ctx.fillStyle = '#ecfdf5';
  ctx.fill();
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 23px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛡️  OFFICIALLY VERIFIED CREDENTIAL', badgeX + badgeW / 2, badgeY + 43);

  // 4. Main Certificate Header
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 88px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE OF COMPLETION', w / 2, 385);

  // Ornate Divider with Diamond
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 380, 435);
  ctx.lineTo(w / 2 - 45, 435);
  ctx.moveTo(w / 2 + 45, 435);
  ctx.lineTo(w / 2 + 380, 435);
  ctx.stroke();

  ctx.fillStyle = '#b45309';
  ctx.font = '36px Georgia, serif';
  ctx.fillText('✦', w / 2, 446);

  // Subtitle
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('THIS IS PROUDLY PRESENTED TO', w / 2, 510);

  // 5. Student Name in Majestic Typography
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 96px Georgia, "Times New Roman", serif';
  ctx.fillText(certificate.studentName || 'Distinguished Scholar', w / 2, 650);

  // Elegant tapered gold gradient underline
  const nameGrad = ctx.createLinearGradient(w / 2 - 480, 0, w / 2 + 480, 0);
  nameGrad.addColorStop(0, 'rgba(180, 83, 9, 0)');
  nameGrad.addColorStop(0.5, 'rgba(180, 83, 9, 0.9)');
  nameGrad.addColorStop(1, 'rgba(180, 83, 9, 0)');
  ctx.strokeStyle = nameGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 500, 690);
  ctx.lineTo(w / 2 + 500, 690);
  ctx.stroke();

  // 6. Achievement Statement & Course Title
  ctx.fillStyle = '#475569';
  ctx.font = '34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    'for successfully demonstrating mastery and completing all lectures, curriculum modules, and academic requirements for',
    w / 2,
    775
  );

  // Multi-line Course Title
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const titleLines = wrapText(ctx, certificate.courseTitle, 2200);
  let currentY = 875;
  for (const line of titleLines) {
    ctx.fillText(line, w / 2, currentY);
    currentY += 76;
  }

  // Discipline Badge (if present)
  let nextSectionY = currentY;
  if (certificate.categoryName) {
    const discY = currentY + 12;
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const discText = `Academic Discipline: ${certificate.categoryName}`;
    const pillWidth = ctx.measureText(discText).width + 80;
    drawRoundedRect(ctx, w / 2 - pillWidth / 2, discY, pillWidth, 54, 27);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.fillText(discText, w / 2, discY + 36);
    nextSectionY = discY + 68;
  }

  // Instructor Mention
  ctx.fillStyle = '#64748b';
  ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    `Course instructed and verified by ${certificate.tutorName || 'StudyBuddy Instructor'} • ${certificate.totalLessons || 1} Comprehensive Lectures Completed`,
    w / 2,
    nextSectionY + 45
  );

  // 7. Signatures & Golden Official Embossed Seal
  const footerY = 1530;

  // Instructor Signature (Left)
  ctx.font = 'italic 56px "Brush Script MT", "Segoe Script", "Times New Roman", cursive';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(certificate.tutorName || 'Verified Tutor', 520, footerY);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, footerY + 20);
  ctx.lineTo(740, footerY + 20);
  ctx.stroke();

  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Course Instructor', 520, footerY + 65);

  ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(certificate.tutorName || 'Subject Matter Specialist', 520, footerY + 105);

  // Center: Golden Embossed Seal with Ribbons
  const sealX = w / 2;
  const sealY = footerY + 35;
  const sealRad = 110;

  // Ribbon Left
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(sealX - 25, sealY + 45);
  ctx.lineTo(sealX - 85, sealY + 160);
  ctx.lineTo(sealX - 55, sealY + 145);
  ctx.lineTo(sealX - 25, sealY + 165);
  ctx.lineTo(sealX - 5, sealY + 60);
  ctx.closePath();
  ctx.fill();

  // Ribbon Right
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(sealX + 5, sealY + 60);
  ctx.lineTo(sealX + 25, sealY + 165);
  ctx.lineTo(sealX + 55, sealY + 145);
  ctx.lineTo(sealX + 85, sealY + 160);
  ctx.lineTo(sealX + 25, sealY + 45);
  ctx.closePath();
  ctx.fill();

  // Seal Body (Radial gold gradient)
  const sealGrad = ctx.createRadialGradient(sealX - 20, sealY - 20, 10, sealX, sealY, sealRad);
  sealGrad.addColorStop(0, '#fef08a');
  sealGrad.addColorStop(0.55, '#d97706');
  sealGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRad, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.strokeStyle = '#fbbf24';
  ctx.stroke();

  // Dashed inner circle
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRad - 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Seal Embossed Typography
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('STUDYBUDDY', sealX, sealY - 32);

  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('★ VERIFIED ★', sealX, sealY + 10);

  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('EXCELLENCE', sealX, sealY + 46);

  // Academic Director Signature (Right)
  ctx.font = 'italic 56px "Brush Script MT", "Segoe Script", "Times New Roman", cursive';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText('Dr. A. Verma', w - 520, footerY);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w - 740, footerY + 20);
  ctx.lineTo(w - 300, footerY + 20);
  ctx.stroke();

  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Academic Director', w - 520, footerY + 65);

  ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('StudyBuddy Certification Board', w - 520, footerY + 105);

  // 8. Meta Information Bar at Bottom
  const formattedDate = new Date(certificate.completedAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 1870);
  ctx.lineTo(w - 120, 1870);
  ctx.stroke();

  ctx.font = '26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';

  ctx.textAlign = 'left';
  ctx.fillText(`Issue Date: ${formattedDate}`, 130, 1925);

  ctx.textAlign = 'center';
  ctx.fillText(`Credential ID: ${certificate.certificateId}`, w / 2, 1925);

  ctx.textAlign = 'right';
  ctx.fillText(`Verification Code: ${certificate.verificationCode}`, w - 130, 1925);

  return canvas;
}

/**
 * Downloads the certificate directly as a high-quality A4 landscape PDF.
 * Uses jsPDF without opening the browser print preview, guaranteeing
 * zero blank page issues.
 */
export async function downloadCertificateAsPdf(certificate: CourseCertificate): Promise<void> {
  const canvas = createCertificateCanvas(certificate);
  const imgData = canvas.toDataURL('image/png', 1.0);

  // Standard A4 dimensions in landscape: 297mm width x 210mm height
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');

  const sanitizedTitle = (certificate.courseTitle || 'Course')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 45);

  pdf.save(`StudyBuddy_Certificate_${sanitizedTitle}.pdf`);
}

/**
 * Downloads the certificate directly as an ultra-high-resolution PNG image.
 */
export function downloadCertificateAsImage(certificate: CourseCertificate): void {
  const canvas = createCertificateCanvas(certificate);
  const sanitizedTitle = (certificate.courseTitle || 'Course')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 45);

  const filename = `StudyBuddy_Certificate_${sanitizedTitle}.png`;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Prints the certificate via an isolated iframe embedding the pre-rendered canvas.
 * Because the image is pre-rendered and embedded as a direct <img>,
 * this is 100% immune to CSS module scoping or React root visibility issues.
 */
export function printCertificateDirectly(certificate: CourseCertificate): void {
  const canvas = createCertificateCanvas(certificate);
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  const oldIframe = document.getElementById('sb-cert-print-iframe');
  if (oldIframe) {
    oldIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'sb-cert-print-iframe';
  iframe.setAttribute(
    'style',
    'position:fixed;top:-9999px;left:-9999px;width:1200px;height:850px;border:none;'
  );
  iframe.setAttribute('title', 'Print Certificate');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>StudyBuddy Certificate - ${certificate.courseTitle}</title>
        <style>
          @page {
            size: landscape;
            margin: 0;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          img {
            max-width: 98vw;
            max-height: 98vh;
            width: auto;
            height: auto;
            object-fit: contain;
            display: block;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="StudyBuddy Certificate" />
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }
  }, 350);
}

// Backwards-compatibility alias for older code
export const printCertificateViaIframe = (_el: HTMLElement, _title?: string) => {
  // Fallback to native print if called directly with element
  window.print();
};
