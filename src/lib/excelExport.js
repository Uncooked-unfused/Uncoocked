/**
 * Utility functions for exporting data to Microsoft Excel (.xls / XML Spreadsheet) and CSV (.csv)
 * with full UTF-8 BOM encoding support for special characters and currencies (₹).
 */

/**
 * Escapes XML entities to prevent formatting breakage in Excel XML spreadsheets.
 */
function escapeXml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Escapes CSV values according to RFC 4180.
 */
function escapeCsv(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Export data to an XML-based Excel Workbook (.xls) that opens seamlessly in Microsoft Excel,
 * Apple Numbers, and Google Sheets with pre-styled headers and proper cell formats.
 *
 * @param {Object} options
 * @param {string} options.filename - Name of file without extension
 * @param {string} [options.sheetName="Sheet1"] - Name of the worksheet
 * @param {Array<{ key: string, label: string, type?: "String" | "Number" }>} options.columns - Column configuration
 * @param {Array<Object>} options.data - Row data objects
 */
export function exportToExcel({ filename, sheetName = "Data", columns, data }) {
  const safeFilename = (filename || "export").replace(/[^a-zA-Z0-9_-]/g, "_") + ".xls";

  // Build Excel XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<?mso-application progid="Excel.Sheet"?>\n`;
  xml += `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n`;
  xml += ` xmlns:o="urn:schemas-microsoft-com:office:office"\n`;
  xml += ` xmlns:x="urn:schemas-microsoft-com:office:excel"\n`;
  xml += ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n`;
  xml += ` xmlns:html="http://www.w3.org/TR/REC-html40">\n`;

  // Styles
  xml += ` <Styles>\n`;
  xml += `  <Style ss:ID="Default" ss:Name="Normal">\n`;
  xml += `   <Alignment ss:Vertical="Center"/>\n`;
  xml += `   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>\n`;
  xml += `  </Style>\n`;
  xml += `  <Style ss:ID="Header">\n`;
  xml += `   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n`;
  xml += `   <Borders>\n`;
  xml += `    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#4F46E5"/>\n`;
  xml += `   </Borders>\n`;
  xml += `   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>\n`;
  xml += `   <Interior ss:Color="#18181B" ss:Pattern="Solid"/>\n`;
  xml += `  </Style>\n`;
  xml += `  <Style ss:ID="DataCell">\n`;
  xml += `   <Alignment ss:Vertical="Center"/>\n`;
  xml += `   <Borders>\n`;
  xml += `    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>\n`;
  xml += `   </Borders>\n`;
  xml += `  </Style>\n`;
  xml += `  <Style ss:ID="NumberCell">\n`;
  xml += `   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>\n`;
  xml += `   <Borders>\n`;
  xml += `    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>\n`;
  xml += `   </Borders>\n`;
  xml += `  </Style>\n`;
  xml += ` </Styles>\n`;

  // Worksheet
  xml += ` <Worksheet ss:Name="${escapeXml(sheetName)}">\n`;
  xml += `  <Table ss:DefaultRowHeight="20">\n`;

  // Column definitions with sensible widths
  columns.forEach(() => {
    xml += `   <Column ss:AutoFitWidth="1" ss:Width="130"/>\n`;
  });

  // Header row
  xml += `   <Row ss:Height="26" ss:StyleID="Header">\n`;
  columns.forEach(col => {
    xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>\n`;
  });
  xml += `   </Row>\n`;

  // Data rows
  data.forEach(row => {
    xml += `   <Row ss:Height="22">\n`;
    columns.forEach(col => {
      const val = row[col.key];
      const isNum = col.type === "Number" && typeof val === "number" && !isNaN(val);
      const cellStyle = isNum ? "NumberCell" : "DataCell";
      const dataType = isNum ? "Number" : "String";
      const displayVal = isNum ? val : (val !== null && val !== undefined ? String(val) : "");

      xml += `    <Cell ss:StyleID="${cellStyle}"><Data ss:Type="${dataType}">${escapeXml(displayVal)}</Data></Cell>\n`;
    });
    xml += `   </Row>\n`;
  });

  xml += `  </Table>\n`;
  xml += ` </Worksheet>\n`;
  xml += `</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  downloadBlob(blob, safeFilename);
}

/**
 * Export data to a standard CSV file with UTF-8 BOM so Excel opens it with proper encoding.
 *
 * @param {Object} options
 * @param {string} options.filename - Name of file without extension
 * @param {Array<{ key: string, label: string }>} options.columns - Column configuration
 * @param {Array<Object>} options.data - Row data objects
 */
export function exportToCSV({ filename, columns, data }) {
  const safeFilename = (filename || "export").replace(/[^a-zA-Z0-9_-]/g, "_") + ".csv";

  const headerRow = columns.map(col => escapeCsv(col.label)).join(",");
  const dataRows = data.map(row =>
    columns.map(col => escapeCsv(row[col.key])).join(",")
  );

  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, safeFilename);
}

/**
 * Triggers a client-side file download.
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export attendees formatted for Excel with complete fields.
 */
export function exportAttendeesData(attendees, eventId, eventTitle = "Event", format = "excel") {
  const columns = [
    { key: "id", label: "Registration ID" },
    { key: "name", label: "Attendee Name" },
    { key: "email", label: "Email Address" },
    { key: "date", label: "Registration Date" },
    { key: "ticketType", label: "Ticket Tier" },
    { key: "paymentStatus", label: "Payment Status" },
    { key: "coupon", label: "Coupon Code" },
    { key: "teamName", label: "Team Name" },
    { key: "track", label: "Selected Track" },
    { key: "status", label: "Registration Status" },
    { key: "checkedIn", label: "Checked In (Yes/No)" },
  ];

  const formattedData = attendees.map(a => ({
    id: a.id || "-",
    name: a.name || "-",
    email: a.email || "-",
    date: a.date || "-",
    ticketType: a.ticketType || "General Admission",
    paymentStatus: a.paymentStatus || "-",
    coupon: a.coupon || "-",
    teamName: a.teamName || "-",
    track: a.track || "-",
    status: a.status || "Confirmed",
    checkedIn: a.checkedIn ? "Yes" : "No",
  }));

  const filename = `${eventTitle ? eventTitle.toLowerCase().replace(/[^a-z0-9]/g, "_") : "event"}_attendees_${eventId || "data"}`;

  if (format === "excel") {
    exportToExcel({
      filename,
      sheetName: "Attendees",
      columns,
      data: formattedData,
    });
  } else {
    exportToCSV({
      filename,
      columns,
      data: formattedData,
    });
  }
}
