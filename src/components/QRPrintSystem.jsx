import React from 'react';

/**
 * QRPrintSystem
 * A professional system for generating high-quality QR PDF/Printouts.
 * Optimized for high-resolution Base64 images to ensure visibility in all contexts.
 */

// --- COMPONENTS ---

/**
 * Individual QR Card optimized for full-page printing
 */
const QRPrintCard = ({ point, objective, companyName, qrImage }) => {
  return (
    <div className="qr-print-page">
      <div className="qr-print-container">
        <div className="qr-print-header">
          <div className="brand">{companyName || 'CENTINELA SECURITY'}</div>
          <div className="objective">{objective?.nombre || 'OBJETIVO GENERAL'}</div>
        </div>
        
        <div className="qr-print-main">
          <h1 className="qr-title">{point.name}</h1>
          <div className="qr-image-wrapper">
             {qrImage ? (
               <img src={qrImage} alt={point.name} className="qr-final-image" />
             ) : (
               <div className="qr-placeholder">Cargando imagen QR...</div>
             )}
          </div>
          <div className="qr-footer-info">
            <span className="qr-id">ID: {point.id}</span>
            <span className="qr-code">CODE: {point.code || 'N/A'}</span>
          </div>
        </div>

        <div className="qr-print-footer">
          SISTEMA DE GESTIÓN OPERATIVA - CENTINELA 2.0
        </div>
      </div>
    </div>
  );
};

/**
 * Label Format: Multiple QR per page
 */
const QRLabelGrid = ({ points, objectives, companyName, qrImages }) => {
  return (
    <div className="qr-labels-grid-page">
      <div className="qr-labels-container">
        {points.map(point => {
          const obj = objectives.find(o => o.id === point.objectiveId);
          const qrImg = qrImages[point.id];
          return (
            <div key={point.id} className="qr-label-item">
              <div className="label-brand">{companyName || 'CENTINELA'}</div>
              <div className="label-obj">{obj?.nombre || 'GENERAL'}</div>
              <div className="label-name">{point.name}</div>
              <div className="qr-image-mini">
                {qrImg ? (
                  <img src={qrImg} style={{ width: '80px', height: '80px' }} alt="QR" />
                ) : (
                  <div style={{ fontSize: '8px' }}>Cargando...</div>
                )}
              </div>
              <div className="label-footer">{point.code}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Main Print View
 */
export const QRPrintView = ({ points, objectives, companyName, config, qrImages }) => {
  if (!points || points.length === 0) return null;

  return (
    <div className="qr-print-system-root print-only">
      <style>{`
        @media screen {
          .qr-print-system-root { display: none; }
        }

        @media print {
          /* Global reset for print */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print, header, nav, footer, .noprint {
            display: none !important;
          }

          .qr-print-system-root {
            display: block !important;
            width: 100% !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }

          /* One QR per Page Layout */
          .qr-print-page {
            width: 210mm;
            height: 296mm; /* Margen de seguridad para evitar saltos extra */
            page-break-after: always;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            box-sizing: border-box;
            padding: 15mm;
            position: relative;
            overflow: hidden;
          }

          .qr-print-container {
            width: 100%;
            height: 100%;
            border: 2px solid #f1f5f9;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 20mm 10mm;
            box-sizing: border-box;
            border-radius: 10mm;
          }

          .qr-print-header {
            text-align: center;
          }

          .brand {
            font-size: 16pt;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 5px;
            margin-bottom: 5mm;
            text-transform: uppercase;
          }

          .objective {
            font-size: 20pt;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
          }

          .qr-print-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
          }

          .qr-title {
            font-size: 38pt;
            font-weight: 900;
            color: black;
            margin: 0 0 15mm 0;
            text-align: center;
            text-transform: uppercase;
            line-height: 1.1;
          }

          .qr-image-wrapper {
            background: white;
            padding: 5mm;
            border: 1pt solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qr-final-image {
            width: 130mm;
            height: 130mm;
            display: block;
          }

          .qr-footer-info {
            margin-top: 15mm;
            display: flex;
            gap: 15mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11pt;
            color: #94a3b8;
            font-weight: bold;
          }

          .qr-print-footer {
            font-size: 10pt;
            color: #94a3b8;
            text-align: center;
            border-top: 1pt solid #f1f5f9;
            width: 80%;
            padding-top: 5mm;
            font-weight: bold;
          }

          /* Labels Layout */
          .qr-labels-grid-page {
            width: 210mm;
            padding: 10mm;
            box-sizing: border-box;
            display: block;
          }

          .qr-labels-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5mm;
          }

          .qr-label-item {
            border: 0.5pt dashed #ccc;
            padding: 5mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            page-break-inside: avoid;
            background: white;
          }

          .label-brand { font-size: 9pt; font-weight: 900; color: #3b82f6; margin-bottom: 2mm; text-transform: uppercase; }
          .label-obj { font-size: 7pt; color: #64748b; margin-bottom: 1mm; text-transform: uppercase; font-weight: bold; }
          .label-name { font-size: 11pt; font-weight: 800; margin-bottom: 3mm; height: 12mm; display: flex; align-items: center; justify-content: center; line-height: 1.2; text-transform: uppercase; }
          .label-footer { font-size: 7pt; color: #94a3b8; margin-top: 2mm; font-family: monospace; font-weight: bold; }
          
          .qr-image-mini img {
            display: block;
            margin: 0 auto;
          }
        }
      `}</style>

      {config.layout === 'full' ? (
        points.map(point => (
          <QRPrintCard 
            key={point.id} 
            point={point} 
            objective={objectives.find(o => o.id === point.objectiveId)} 
            companyName={companyName}
            qrImage={qrImages[point.id]}
          />
        ))
      ) : (
        <QRLabelGrid 
          points={points} 
          objectives={objectives} 
          companyName={companyName} 
          qrImages={qrImages}
        />
      )}
    </div>
  );
};
