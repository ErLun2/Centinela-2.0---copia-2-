import React, { useEffect, useState, useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

/**
 * QRComponents.jsx
 * Separación robusta entre visualización UI y exportación profesional a PDF.
 */

// --- 1. COMPONENTE PARA LA APP (UI) ---

/**
 * QrCard: Componente optimizado para la grilla del dashboard.
 * Tamaño reducido y prolijo.
 */
export const QrCard = ({ point, objective, onDelete, assignedRondas = [] }) => {
  return (
    <div className="qr-ui-card fade-up" style={{ 
      padding: '20px', 
      background: 'rgba(255,255,255,0.02)', 
      borderRadius: '24px', 
      border: '1px solid rgba(255,255,255,0.05)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '8px', 
      textAlign: 'center', 
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      transition: '0.3s'
    }}>
      <div style={{ color: '#00d2ff', fontWeight: '900', fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase' }}>CENTINELA SECURITY</div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase' }}>{objective?.nombre || 'General'}</div>
      <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 800 }}>{point.name}</h4>
      
      <div className="qr-ui-container" style={{ 
        background: 'white', 
        padding: '12px', 
        borderRadius: '12px', 
        marginTop: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <QRCodeSVG
          value={JSON.stringify({ id: point.id, type: 'ronda_qr' })}
          size={140} // Tamaño fijo y prolijo para la UI
          level="H"
          includeMargin={false}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>

      {/* Rondas asignadas */}
      <div className="noprint" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '5px' }}>
         {assignedRondas.length === 0 ? (
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px' }}>SIN RONDA</span>
         ) : (
            assignedRondas.map(r => (
               <span key={r.id} style={{ fontSize: '0.6rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>{r.nombre.toUpperCase()}</span>
            ))
         )}
      </div>

      <div className="noprint" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', marginTop: '5px' }}>PT-ID: {point.id.toUpperCase()}</div>
      
      <button
        onClick={() => onDelete(point)}
        className="noprint"
        style={{ 
          marginTop: '10px', 
          background: 'transparent', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          color: '#ef4444', 
          padding: '6px 12px', 
          borderRadius: '8px', 
          fontSize: '0.7rem', 
          fontWeight: 'bold', 
          cursor: 'pointer',
          width: '100%'
        }}
      >
        ELIMINAR
      </button>
    </div>
  );
};


// --- 2. COMPONENTES PARA IMPRESIÓN (PDF) ---

/**
 * QrPrintPage: El template de página completa para el PDF.
 * Convierte el QR a imagen para asegurar visibilidad en PDF.
 */
const QrPrintPage = ({ point, objective, companyName, size = 350 }) => {
  const canvasRef = useRef(null);
  const [imgData, setImgData] = useState(null);

  useEffect(() => {
    // Generar la imagen a partir del canvas de forma asíncrona
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current.querySelector('canvas');
        if (canvas) {
          setImgData(canvas.toDataURL('image/png'));
        }
      }
    }, 200); // Pequeño delay para asegurar que qrcode.react terminó
    return () => clearTimeout(timer);
  }, [point.id, size]);

  return (
    <div className="qr-print-page">
      <div className="qr-print-content">
        <div className="qr-print-header">
          <div className="brand">{companyName || 'CENTINELA SECURITY'}</div>
          <div className="subtitle">{objective?.nombre || 'OBJETIVO OPERATIVO'}</div>
        </div>

        <div className="qr-print-body">
          <h1 className="qr-point-name">{point.name}</h1>
          
          <div className="qr-image-frame">
            {/* Generador oculto */}
            <div ref={canvasRef} style={{ display: 'none' }}>
              <QRCodeCanvas 
                value={JSON.stringify({ id: point.id, type: 'ronda_qr' })} 
                size={512} // Generamos en alta resolución
                level="H" 
                includeMargin={true} 
              />
            </div>
            
            {/* Imagen final estática (Indispensable para PDF) */}
            {imgData ? (
              <img src={imgData} alt={point.name} style={{ width: `${size}px`, height: `${size}px` }} />
            ) : (
              <div style={{ width: `${size}px`, height: `${size}px`, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10pt' }}>
                Generando código...
              </div>
            )}
          </div>

          <div className="qr-point-id">ID: {point.id} | CODE: {point.code || point.id}</div>
        </div>

        <div className="qr-print-footer">
          SISTEMA DE CONTROL DE RONDAS - CENTINELA 2.0
        </div>
      </div>
    </div>
  );
};

/**
 * QrLabelGrid: Layout de etiquetas (múltiples por hoja)
 */
const QrLabelGrid = ({ points, objectives, companyName }) => {
  return (
    <div className="qr-labels-page">
      <div className="qr-labels-container">
        {points.map(point => (
          <QrLabelItem 
            key={point.id} 
            point={point} 
            objective={objectives.find(o => o.id === point.objectiveId)} 
            companyName={companyName}
          />
        ))}
      </div>
    </div>
  );
};

const QrLabelItem = ({ point, objective, companyName }) => {
  const canvasRef = useRef(null);
  const [imgData, setImgData] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current.querySelector('canvas');
        if (canvas) setImgData(canvas.toDataURL('image/png'));
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [point.id]);

  return (
    <div className="qr-label-item">
      <div className="label-top">{companyName || 'CENTINELA'}</div>
      <div className="label-obj">{objective?.nombre || 'GENERAL'}</div>
      <div className="label-title">{point.name}</div>
      <div className="label-qr">
        <div ref={canvasRef} style={{ display: 'none' }}>
           <QRCodeCanvas value={JSON.stringify({ id: point.id, type: 'ronda_qr' })} size={256} level="H" includeMargin={true} />
        </div>
        {imgData && <img src={imgData} alt="QR" style={{ width: '100px', height: '100px' }} />}
      </div>
      <div className="label-code">{point.code}</div>
    </div>
  );
};


/**
 * QRPrintSystem: Componente raíz para la vista de impresión.
 */
export const QRPrintSystem = ({ points, objectives, companyName, config }) => {
  if (!points || points.length === 0) return null;

  return (
    <div className="qr-print-system-root print-only">
      <style>{`
        @media screen {
          .qr-print-system-root { display: none !important; }
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }

          .noprint, nav, header, aside, .no-print {
            display: none !important;
          }

          .qr-print-system-root {
            display: block !important;
            width: 100% !important;
          }

          /* Layout Full Page */
          .qr-print-page {
            width: 210mm;
            height: 297mm;
            page-break-after: always;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            background: white;
          }

          .qr-print-content {
            width: 90%;
            height: 90%;
            border: 2pt solid #000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 20mm 10mm;
            text-align: center;
          }

          .brand { font-size: 16pt; font-weight: 900; letter-spacing: 5px; color: #1e293b; margin-bottom: 5mm; }
          .subtitle { font-size: 18pt; font-weight: 700; color: #64748b; }
          .qr-point-name { font-size: 36pt; font-weight: 900; margin: 10mm 0; }
          .qr-image-frame { padding: 5mm; background: white; border: 1pt solid #eee; }
          .qr-point-id { font-family: monospace; font-size: 10pt; color: #94a3b8; margin-top: 10mm; }
          .qr-print-footer { font-size: 9pt; color: #cbd5e1; border-top: 1pt solid #f1f5f9; width: 70%; padding-top: 5mm; }

          /* Layout Labels (3x5 approx) */
          .qr-labels-page { width: 210mm; padding: 10mm; box-sizing: border-box; }
          .qr-labels-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10mm; }
          .qr-label-item { 
            border: 0.5pt solid #ddd; 
            padding: 5mm; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            text-align: center; 
            page-break-inside: avoid;
          }
          .label-top { font-size: 8pt; font-weight: 900; color: #3b82f6; }
          .label-obj { font-size: 7pt; color: #64748b; }
          .label-title { font-size: 11pt; font-weight: 900; margin: 3mm 0; height: 10mm; display: flex; align-items: center; }
          .label-code { font-size: 6pt; color: #94a3b8; font-family: monospace; margin-top: 2mm; }
        }
      `}</style>

      {config.layout === 'full' ? (
        points.map(point => (
          <QrPrintPage 
            key={point.id} 
            point={point} 
            objective={objectives.find(o => o.id === point.objectiveId)} 
            companyName={companyName}
            size={config.size}
          />
        ))
      ) : (
        <QrLabelGrid 
          points={points} 
          objectives={objectives} 
          companyName={companyName} 
        />
      )}
    </div>
  );
};
