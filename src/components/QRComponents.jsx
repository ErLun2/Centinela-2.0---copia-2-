import React, { useEffect, useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * QRPrintSystem
 * A professional system for generating high-quality QR PDF/Printouts.
 */

// --- COMPONENTS ---

/**
 * Individual QR Card optimized for full-page printing
 */
const QRPrintCard = ({ point, objective, companyName }) => {
  const [qrLoaded, setQrLoaded] = useState(false);
  const canvasRef = useRef(null);
  const [imgData, setImgData] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current.querySelector('canvas');
        if (canvas) {
          setImgData(canvas.toDataURL('image/png'));
          setQrLoaded(true);
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [point.id]);

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
             <div ref={canvasRef} style={{ display: 'none' }}>
                <QRCodeCanvas 
                  value={JSON.stringify({ id: point.id, type: 'ronda_qr' })} 
                  size={512} 
                  level="H" 
                  includeMargin={true} 
                />
             </div>
             {imgData ? (
               <img src={imgData} alt={point.name} className="qr-final-image" />
             ) : (
               <div className="qr-placeholder">Cargando QR...</div>
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
const QRLabelGrid = ({ points, objectives, companyName }) => {
  const [imgDataMap, setImgDataMap] = useState({});

  return (
    <div className="qr-labels-grid-page">
      <div className="qr-labels-container">
        {points.map(point => {
          const obj = objectives.find(o => o.id === point.objectiveId);
          return (
            <div key={point.id} className="qr-label-item">
              <div className="label-brand">{companyName || 'CENTINELA'}</div>
              <div className="label-obj">{obj?.nombre || 'GENERAL'}</div>
              <div className="label-name">{point.name}</div>
              <QRToImage value={JSON.stringify({ id: point.id, type: 'ronda_qr' })} size={120} />
              <div className="label-footer">{point.code}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QRToImage = ({ value, size }) => {
  const canvasRef = useRef(null);
  const [imgData, setImgData] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current.querySelector('canvas');
        if (canvas) setImgData(canvas.toDataURL('image/png'));
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="qr-image-mini">
      <div ref={canvasRef} style={{ display: 'none' }}>
        <QRCodeCanvas value={value} size={256} level="H" includeMargin={true} />
      </div>
      {imgData && <img src={imgData} style={{ width: size, height: size }} alt="QR" />}
    </div>
  );
};

/**
 * Main Print View
 */
export const QRPrintView = ({ points, objectives, companyName, config }) => {
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
            size: A4;
            margin: 0;
          }

          /* One QR per Page Layout */
          .qr-print-page {
            width: 210mm;
            height: 297mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            box-sizing: border-box;
            padding: 20mm;
            position: relative;
          }

          .qr-print-container {
            width: 100%;
            height: 100%;
            border: 1px solid #eee;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 20mm 10mm;
            box-sizing: border-box;
          }

          .qr-print-header {
            text-align: center;
          }

          .brand {
            font-size: 14pt;
            font-weight: 900;
            color: #1e293b;
            letter-spacing: 4px;
            margin-bottom: 5mm;
            text-transform: uppercase;
          }

          .objective {
            font-size: 18pt;
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
            font-size: 32pt;
            font-weight: 900;
            color: black;
            margin: 0 0 15mm 0;
            text-align: center;
            text-transform: uppercase;
          }

          .qr-image-wrapper {
            background: white;
            padding: 5mm;
            border: 2px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qr-final-image {
            width: 120mm;
            height: 120mm;
            display: block;
          }

          .qr-footer-info {
            margin-top: 15mm;
            display: flex;
            gap: 10mm;
            font-family: monospace;
            font-size: 10pt;
            color: #94a3b8;
          }

          .qr-print-footer {
            font-size: 9pt;
            color: #cbd5e1;
            text-align: center;
            border-top: 1pt solid #f1f5f9;
            width: 80%;
            padding-top: 5mm;
          }

          /* Labels Layout */
          .qr-labels-grid-page {
            width: 210mm;
            padding: 10mm;
            box-sizing: border-box;
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
          }

          .label-brand { font-size: 8pt; font-weight: 900; color: #3b82f6; margin-bottom: 2mm; }
          .label-obj { font-size: 7pt; color: #64748b; margin-bottom: 1mm; }
          .label-name { font-size: 10pt; font-weight: 700; margin-bottom: 3mm; height: 12mm; display: flex; align-items: center; }
          .label-footer { font-size: 6pt; color: #94a3b8; margin-top: 2mm; font-family: monospace; }
        }
      `}</style>

      {config.layout === 'full' ? (
        points.map(point => (
          <QRPrintCard 
            key={point.id} 
            point={point} 
            objective={objectives.find(o => o.id === point.objectiveId)} 
            companyName={companyName}
          />
        ))
      ) : (
        <QRLabelGrid 
          points={points} 
          objectives={objectives} 
          companyName={companyName} 
        />
      )}
    </div>
  );
};
