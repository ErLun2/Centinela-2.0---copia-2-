import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';

/**
 * QRComponents.jsx
 * Sistema robusto de pre-generación de imágenes QR para evitar el problema de "Canvas en blanco" en PDFs.
 */

// --- 1. UTILIDAD DE GENERACIÓN (Independiente de la UI) ---

/**
 * generateQRImages: Convierte una lista de puntos en un mapa de imágenes base64.
 * Es asíncrono y asegura que los QR existan como imágenes estáticas antes de imprimir.
 */
export const generateQRImages = async (points, size = 512) => {
  const images = {};
  for (const point of points) {
    try {
      const data = JSON.stringify({ id: point.id, type: 'ronda_qr' });
      // Generación directa a Base64 usando la librería 'qrcode'
      const url = await QRCode.toDataURL(data, {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      images[point.id] = url;
    } catch (err) {
      console.error(`Error generando QR para ${point.id}:`, err);
    }
  }
  return images;
};

// --- 2. COMPONENTE PARA LA APP (UI) ---

/**
 * QrCard: Para visualización rápida en el Dashboard.
 * Usa SVG para máxima nitidez en pantalla sin problemas de renderizado.
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
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    }}>
      <div style={{ color: '#00d2ff', fontWeight: '900', fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase' }}>CENTINELA SECURITY</div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase' }}>{objective?.nombre || 'General'}</div>
      <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 800 }}>{point.name}</h4>
      
      <div style={{ background: 'white', padding: '12px', borderRadius: '12px', marginTop: '5px' }}>
        <QRCodeSVG
          value={JSON.stringify({ id: point.id, type: 'ronda_qr' })}
          size={140}
          level="H"
        />
      </div>

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
          marginTop: '10px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', 
          color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
        }}
      >
        ELIMINAR
      </button>
    </div>
  );
};


// --- 3. COMPONENTES PARA IMPRESIÓN (ESTÁTICOS) ---

/**
 * QrPrintPage: Renderiza un QR pre-generado como imagen estática.
 */
const QrPrintPage = ({ point, objective, companyName, qrImage, size }) => {
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
            <img 
              src={qrImage} 
              alt={point.name} 
              style={{ width: `${size}px`, height: `${size}px`, display: 'block' }} 
            />
          </div>
          <div className="qr-point-id">ID: {point.id} | VERIFICADO POR SISTEMA CENTINELA</div>
        </div>

        <div className="qr-print-footer">
          CONTROL DE ACCESO Y RONDAS - GENERADO EL {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

const QrLabelItem = ({ point, objective, companyName, qrImage }) => {
  return (
    <div className="qr-label-item">
      <div className="label-top">{companyName || 'CENTINELA'}</div>
      <div className="label-obj">{objective?.nombre || 'PUESTO'}</div>
      <div className="label-title">{point.name}</div>
      <div className="label-qr">
        <img src={qrImage} alt="QR" style={{ width: '100px', height: '100px' }} />
      </div>
      <div className="label-code">{point.id.slice(0, 8).toUpperCase()}</div>
    </div>
  );
};


/**
 * QRPrintSystem: Componente raíz para impresión. 
 * IMPORTANTE: No genera nada, solo muestra lo que ya fue pre-generado.
 */
export const QRPrintSystem = ({ points, objectives, companyName, config, qrImages }) => {
  if (!points || points.length === 0 || !qrImages) return null;

  return (
    <div className="qr-print-system-root print-only">
      <style>{`
        @media screen { .qr-print-system-root { display: none !important; } }
        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .noprint { display: none !important; }
          .qr-print-system-root { display: block !important; width: 100% !important; }

          .qr-print-page {
            width: 210mm; height: 297mm;
            page-break-after: always;
            display: flex; align-items: center; justify-content: center;
            background: white;
          }
          .qr-print-content {
            width: 180mm; height: 260mm;
            border: 3pt solid #000;
            display: flex; flex-direction: column; align-items: center; justify-content: space-between;
            padding: 15mm; text-align: center;
          }
          .brand { font-size: 14pt; font-weight: 900; letter-spacing: 4px; }
          .subtitle { font-size: 16pt; font-weight: 700; color: #444; }
          .qr-point-name { font-size: 42pt; font-weight: 900; margin: 10mm 0; }
          .qr-image-frame { padding: 5mm; border: 1pt solid #eee; }
          .qr-point-id { font-family: monospace; font-size: 9pt; color: #666; margin-top: 10mm; }
          .qr-print-footer { font-size: 8pt; color: #999; border-top: 1pt solid #eee; width: 80%; padding-top: 5mm; }

          .qr-labels-page { width: 210mm; padding: 10mm; }
          .qr-labels-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }
          .qr-label-item { 
            border: 1pt solid #000; padding: 3mm; 
            display: flex; flex-direction: column; align-items: center; text-align: center;
            page-break-inside: avoid;
          }
          .label-top { font-size: 7pt; font-weight: 900; }
          .label-obj { font-size: 6pt; }
          .label-title { font-size: 9pt; font-weight: 900; margin: 2mm 0; height: 8mm; display: flex; align-items: center; }
        }
      `}</style>

      {config.layout === 'full' ? (
        points.map(point => (
          <QrPrintPage 
            key={point.id} 
            point={point} 
            objective={objectives.find(o => o.id === point.objectiveId)} 
            companyName={companyName}
            qrImage={qrImages[point.id]}
            size={config.size}
          />
        ))
      ) : (
        <div className="qr-labels-page">
          <div className="qr-labels-container">
            {points.map(point => (
              <QrLabelItem 
                key={point.id} point={point} 
                objective={objectives.find(o => o.id === point.objectiveId)} 
                companyName={companyName}
                qrImage={qrImages[point.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
