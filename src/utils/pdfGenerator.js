import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Helper function to get legal basis label
const getLegalBasisLabel = (id) => {
  const labels = {
    'consent': 'Consimtamant',
    'contract': 'Contractual obligations',
    'legitimate': 'Interes legitim',
    'legal': 'Obligatie legala',
    'public': 'Interes public',
    'vital': 'Protejarea intereselor vitale'
  };
  return labels[id] || id;
};

export const exportFlowToPDF = (flowData, meta, processes = []) => {
  const doc = new jsPDF();
  
  // Set font styles
  doc.setFont('helvetica');
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text(`Flow Report: ${meta.flowName || 'Unnamed Flow'}`, 14, 20);
  
  // Date generated
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Generated: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 28);
  
  // Status badge
  const statusColor = meta.status === 'Aprobat' ? [34, 197, 94] : [156, 163, 175];
  doc.setFillColor(...statusColor);
  doc.roundedRect(14, 32, 30, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(meta.status || 'NU', 29, 37, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(33, 37, 41);
  
  let yPos = 50;
  
  // Helper function to add a section
  const addSection = (label, value) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return yPos;
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Bold label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${label}:`, 14, yPos);
    
    // Normal value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Handle arrays
    if (Array.isArray(value)) {
      const valueText = value.join(', ');
      const splitText = doc.splitTextToSize(valueText, 180);
      doc.text(splitText, 14, yPos + 6);
      yPos += 6 + (splitText.length * 4);
    } else {
      const splitText = doc.splitTextToSize(value.toString(), 180);
      doc.text(splitText, 14, yPos + 6);
      yPos += 6 + (splitText.length * 4);
    }
    
    yPos += 4; // Add spacing between sections
    return yPos;
  };
  
  // General Data Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('GENERAL INFORMATION', 14, yPos);
  yPos += 10;
  
  addSection('Description', flowData.generalData?.fluxDescription || meta.flowDescription);
  
  // Processing Data Section
  if (flowData.processingData?.purposes?.length > 0) {
    addSection('Processing scopes', flowData.processingData.purposes);
  }
  
  // Data Categories Matrix Section
  if (flowData.categoryMatrix && Object.keys(flowData.categoryMatrix).length > 0) {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CATEGORIES OF PROCESSED PERSONAL DATA', 14, yPos);
    yPos += 8;

    const headers = [
      'Category',
      'Listing',
      'Processing method',
      'Processing period',
      'Exclusive storage retention',
      'Legal basis for retention'
    ];

    const labelMap = {
      idData: 'ID data',
      contactData: 'Contact data',
      educationData: 'Education/certifications',
      personalLife: 'Personal life data',
      economic: 'Economic/financial',
      professional: 'Professional activity',
      media: 'Photos/videos/voice',
      connection: 'Connection data',
      location: 'Location data',
      identityNumbers: 'ID numbers (CNP etc.)',
      other: 'Other'
    };

    const rows = Object.entries(flowData.categoryMatrix)
      .map(([key, val]) => [
        labelMap[key] || key,
        (val?.enumerare || '').toString(),
        (val?.method || '').toString(),
        (val?.period || '').toString(),
        (val?.storageOnly || '').toString(),
        (val?.legalBasis || '').toString()
      ]);

    if (rows.length > 0) {
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [217, 234, 211], fontSize: 9 },
        bodyStyles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 32 } },
        styles: { overflow: 'linebreak', cellWidth: 'wrap' }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }
  }
  
  // Legal Basis Section
  if (flowData.legalData?.legalBasis?.length > 0) {
    const legalBasisLabels = flowData.legalData.legalBasis.map(id => getLegalBasisLabel(id));
    addSection('Legal base', legalBasisLabels);
  }
  
  if (flowData.legalData?.legalDetails) {
    addSection('Legal base details', flowData.legalData.legalDetails);
  }
  
  // People Section
  if (flowData.peopleData?.categories?.length > 0) {
    addSection('Targeted persons', flowData.peopleData.categories);
  }
  
  if (flowData.peopleData?.notificationMethods?.length > 0) {
    addSection('Person notification ways', flowData.peopleData.notificationMethods);
  }
  
  // Storage Section
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DATA STORAGE', 14, yPos);
  yPos += 10;
  
  if (flowData.storageData?.policy) {
    addSection('Data storage policy', flowData.storageData.policy);
  }
  
  if (flowData.storageData?.duration) {
    const durationText = `${flowData.storageData.duration.value} ${flowData.storageData.duration.unit}`;
    addSection('Data Storage Period', durationText);
  }
  
  if (flowData.storageData?.policyDetails) {
    addSection('Data Storage Policy information', flowData.storageData.policyDetails);
  }
  
  if (flowData.storageData?.recipientCategories?.length > 0) {
    addSection('Data recipient categories', flowData.storageData.recipientCategories);
  }
  
  // Security Section
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SECURITY MEASURES', 14, yPos);
  yPos += 10;
  
  if (flowData.securityData?.technicalMeasures?.length > 0) {
    addSection('Technical measures', flowData.securityData.technicalMeasures);
  }
  
  if (flowData.securityData?.organizationalMeasures?.length > 0) {
    addSection('Organisational measures', flowData.securityData.organizationalMeasures);
  }
  
  if (flowData.securityData?.policyDocument) {
    addSection('Security measures details', flowData.securityData.policyDocument);
  }
  
  // Processes Table
  if (processes && processes.length > 0) {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('DATA PROCESSES', 14, yPos);
    yPos += 10;
    
    const tableData = processes.map((process, index) => [
      (index + 1).toString(),
      process.name || 'N/A',
      process.activities?.join(', ') || 'N/A',
      process.dcpGroups?.info || 'N/A',
      process.dataSources?.join(', ') || 'N/A',
      process.operators?.join(', ') || 'N/A'
    ]);
    
    doc.autoTable({
      head: [['#', 'Process', 'Activities', 'Groups', 'Sources', 'Operators']],
      body: tableData,
      startY: yPos,
      headStyles: { 
        fillColor: [79, 70, 229],
        fontSize: 9
      },
      bodyStyles: { 
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 45 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 }
      },
      theme: 'grid',
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap'
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // Documents Section
  const allDocuments = [
    ...(flowData.peopleData?.documents || []),
    ...(flowData.legalData?.documents || []),
    ...(flowData.storageData?.documents || []),
    ...(flowData.securityData?.documents || [])
  ];
  
  if (allDocuments.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ATTACHED DOCUMENTS', 14, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    allDocuments.forEach((doc_item, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${index + 1}. ${doc_item.fileName}`, 14, yPos);
      doc.setFontSize(9);
      doc.setTextColor(108, 117, 125);
      doc.text(`   Uploaded: ${format(new Date(doc_item.uploadDate), 'dd.MM.yyyy HH:mm')}`, 14, yPos + 4);
      doc.setTextColor(33, 37, 41);
      doc.setFontSize(10);
      yPos += 10;
    });
  }
  
  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Generated by DClass Flow Management System', 14, 285);
  doc.text(`Page ${doc.getNumberOfPages()}`, 190, 285, { align: 'right' });
  
  // Save the PDF
  const fileName = `${meta.flowName || 'flow'}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};
