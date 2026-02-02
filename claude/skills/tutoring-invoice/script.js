// Version
const VERSION = '1.3.0';

// Display version on load
document.addEventListener('DOMContentLoaded', () => {
    const versionEl = document.getElementById('version');
    if (versionEl) versionEl.textContent = `Invoice Generator v${VERSION}`;

    const versionFormEl = document.getElementById('versionForm');
    if (versionFormEl) versionFormEl.textContent = `Invoice Generator v${VERSION}`;
});

// Add new class entry
document.getElementById('addEntry').addEventListener('click', () => {
    const container = document.getElementById('classEntries');
    const newEntry = document.createElement('div');
    newEntry.className = 'class-entry';
    newEntry.innerHTML = `
        <input type="date" class="class-date" required>
        <input type="number" class="class-hours" placeholder="0" step="0.5" required>
        <input type="number" class="class-minutes" placeholder="0" step="15">
        <input type="text" class="class-note" placeholder="비고">
        <button type="button" class="remove-btn" onclick="removeEntry(this)">삭제</button>
    `;
    container.appendChild(newEntry);
});

// Remove class entry
function removeEntry(button) {
    const entries = document.querySelectorAll('.class-entry');
    if (entries.length > 1) {
        button.parentElement.remove();
    } else {
        alert('최소 1개의 수업 내역이 필요합니다.');
    }
}

// Format date to Korean format
function formatDate(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
}

// Format time display
function formatTime(hours, minutes) {
    let result = '';
    if (hours > 0) {
        result += `${hours}시간`;
        if (minutes > 0) {
            result += ` ${minutes}분`;
        }
    } else {
        result = `${minutes}분`;
    }

    const totalHours = hours + minutes / 60;
    if (totalHours !== hours) {
        result += ` (${totalHours}시간)`;
    }

    return result;
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Generate invoice number (format: YYYYMM-XXXX)
function generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${year}${month}-${random}`;
}

// Format current date (e.g., "2026-01-31")
function formatCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Generate invoice
document.getElementById('invoiceForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const studentName = document.getElementById('studentName').value;
    const hourlyRate = parseInt(document.getElementById('hourlyRate').value);
    const bankName = document.getElementById('bankName').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const accountHolder = document.getElementById('accountHolder').value;

    const classEntries = document.querySelectorAll('.class-entry');
    const classes = [];
    let totalHours = 0;

    classEntries.forEach(entry => {
        const date = entry.querySelector('.class-date').value;
        const hours = parseFloat(entry.querySelector('.class-hours').value) || 0;
        const minutes = parseFloat(entry.querySelector('.class-minutes').value) || 0;
        const note = entry.querySelector('.class-note').value;

        if (date) {
            classes.push({ date, hours, minutes, note });
            totalHours += hours + (minutes / 60);
        }
    });

    // Sort classes by date
    classes.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Determine year and month from first class date
    const firstDate = classes.length > 0 ? new Date(classes[0].date) : new Date();
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth() + 1;

    // Update invoice date
    document.getElementById('invoiceDate').textContent = formatCurrentDate();

    // Update invoice title
    document.getElementById('invoiceTitle').textContent = `${year}년 ${month}월 수업료 청구`;
    document.getElementById('studentNameDisplay').textContent = studentName;

    // Generate and display invoice number
    const invoiceNumber = generateInvoiceNumber();
    document.getElementById('invoiceNumber').textContent = invoiceNumber;

    // Update hourly rate
    document.getElementById('displayRate').textContent = formatNumber(hourlyRate);

    // Update class list (simple text format)
    const classList = document.getElementById('classListSimple');
    classList.innerHTML = '';

    classes.forEach(cls => {
        const p = document.createElement('p');
        const timeStr = formatTime(cls.hours, cls.minutes);
        const noteStr = cls.note ? ` - ${cls.note}` : '';
        p.textContent = `${formatDate(cls.date)} ${timeStr}${noteStr}`;
        classList.appendChild(p);
    });

    // Update total hours
    document.getElementById('totalHours').textContent = totalHours.toFixed(1);

    // Calculate and display total amount
    const totalAmount = Math.round(totalHours * hourlyRate);
    document.getElementById('totalAmount').textContent = `${formatNumber(totalAmount)}원`;

    // Update bank info
    document.getElementById('displayBank').textContent = bankName;
    document.getElementById('displayAccount').textContent = accountNumber;
    document.getElementById('displayHolder').textContent = accountHolder;

    // Show invoice preview
    document.querySelector('.form-section').style.display = 'none';
    document.getElementById('invoicePreview').style.display = 'block';

    // Store data for PDF filename
    window.invoiceData = {
        studentName,
        year,
        month
    };
});

// Edit invoice
document.getElementById('editInvoice').addEventListener('click', () => {
    document.querySelector('.form-section').style.display = 'block';
    document.getElementById('invoicePreview').style.display = 'none';
});

// Download PDF
document.getElementById('downloadPDF').addEventListener('click', async () => {
    const element = document.getElementById('invoice');
    const now = new Date();
    const data = window.invoiceData || { studentName: '수강생', year: now.getFullYear(), month: now.getMonth() + 1 };

    // Hide buttons and version temporarily
    const downloadBtn = document.getElementById('downloadPDF');
    const editBtn = document.getElementById('editInvoice');
    const versionEl = document.getElementById('version');
    downloadBtn.style.display = 'none';
    editBtn.style.display = 'none';
    if (versionEl) versionEl.style.display = 'none';

    try {
        // Generate canvas from HTML
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // A4 dimensions in mm
        const a4Width = 210;
        const a4Height = 297;

        // Calculate dimensions
        const imgWidth = a4Width;
        const imgHeight = (canvas.height * a4Width) / canvas.width;

        // Create PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        // If content fits in one page
        if (imgHeight <= a4Height) {
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        } else {
            // Split into multiple pages
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= a4Height;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= a4Height;
            }
        }

        // Get PDF as blob
        const pdfBlob = pdf.output('blob');

        // Save to server
        const response = await fetch(`/api/invoice/save?studentName=${encodeURIComponent(data.studentName)}&year=${data.year}&month=${data.month}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/pdf'
            },
            body: pdfBlob
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ PDF 저장 완료!\n\n저장 위치:\n${result.path}`);
        } else {
            throw new Error(result.error || 'Server error');
        }
    } catch (error) {
        console.error('PDF 저장 중 오류:', error);
        alert('PDF 저장에 실패했습니다: ' + error.message);
    } finally {
        // Show buttons and version again
        downloadBtn.style.display = 'block';
        editBtn.style.display = 'block';
        if (versionEl) versionEl.style.display = 'block';
    }
});
