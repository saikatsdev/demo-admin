import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const downloadTablePdf = ({title = "Report", tableSelector, fileName = "report.pdf", orientation = "portrait"}) => {
    const doc = new jsPDF({orientation, unit: "pt", format: "a4"});

    doc.setFontSize(16);
    doc.text(title, 40, 40);

    autoTable(doc, {
        html              : tableSelector,
        startY            : 60,
        theme             : "grid",
        styles            : {fontSize: 10, cellPadding: 6},
        headStyles        : {fillColor: [220, 53, 69], textColor: 255},
        alternateRowStyles: {fillColor: [245, 245, 245]},
    });

    doc.save(fileName);
};
