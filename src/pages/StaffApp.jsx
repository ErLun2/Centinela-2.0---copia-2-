import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, QrCode, ShieldAlert, CheckCircle, 
  Loader2, Camera, Map as MapIcon, 
  Zap, Mic, Video, LayoutDashboard, Play, Square,
  MapPin, Clock, FileText, ChevronRight, Navigation, LocateFixed, LogOut,
  Image, Trash2, StopCircle, CircleDot, RotateCcw
} from 'lucide-react';
import jsQR from 'jsqr';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  crearEvento, logAction, actualizarUbicacionGPS,
  iniciarRonda, finalizarRonda, registrarPuntoRuta, 
  registrarEventoAudit 
} from '../lib/dbServices';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Helper para inicializar iconos de forma segura (solo cuando se necesita)
const getLeafletIcons = () => {
  if (typeof window === 'undefined' || !L) return {};
  
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
  
  if (L.Marker.prototype.options) {
    L.Marker.prototype.options.icon = DefaultIcon;
  }

  const guardIcon = L.divIcon({
    className: 'custom-pointer-marker',
    html: `<svg width="30" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#ef4444" stroke="white"/>
            <circle cx="12" cy="10" r="3" fill="white"/>
          </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40]
  });

  const userLocationIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div style="position:relative; display: flex; flex-direction: column; align-items: center;">
            <svg width="34" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#3b82f6" stroke="white"/>
              <circle cx="12" cy="10" r="3" fill="white"/>
            </svg>
            <div style="position:absolute; top:8px; width:10px; height:10px; background:white; border-radius:50%; animation:ping 2s infinite; opacity:0.6;"></div>
          </div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42]
  });

  const objectiveIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4812/4812397.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });

  return { DefaultIcon, guardIcon, userLocationIcon, objectiveIcon };
};

// Componente para centrar el mapa dinámicamente
function ChangeView({ center, zoom = 15 }) {
  const map = useMap();
  const [firstLoad, setFirstLoad] = React.useState(true);
  
  useEffect(() => {
    if (center && firstLoad) {
      map.setView(center, zoom);
      setFirstLoad(false);
    }
  }, [center, map, firstLoad]);
  return null;
}

const OBJETIVOS_MOCK = [
  { id: 'obj1', nombre: 'Planta Industrial Alfa', lat: -34.6037, lng: -58.3816, address: 'Sector Norte, Nave 1' },
  { id: 'obj2', nombre: 'Edificio Torre Central', lat: -34.5937, lng: -58.4016, address: 'Av. Libertador 1500' },
  { id: 'obj3', nombre: 'Centro Logístico Sur', lat: -34.6137, lng: -58.3616, address: 'Parque Industrial, Lote 4' },
];

// ============================================================================
// COMPONENTE: Captura de Foto con Cámara nativa del dispositivo
// ============================================================================
const PhotoCapturePanel = ({ onCapture, onClose, capturedPhoto }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [error, setError] = useState(null);

  const startCamera = useCallback(async (facing) => {
    // Detener stream previo si existe
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setCameraReady(false);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setError('No se pudo acceder a la cámara. Verifique los permisos.');
    }
  }, []);

  useEffect(() => {
    if (!capturedPhoto) {
      startCamera(facingMode);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode, capturedPhoto]);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Redimensionar a máx 480px de ancho para reducir peso drásticamente
    const MAX_DIM = 480;
    const scale = Math.min(MAX_DIM / video.videoWidth, MAX_DIM / video.videoHeight, 1);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // WebP calidad 75% = mejor compresión que JPEG con misma calidad visual (~20-40KB)
    const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    const dataUrl = supportsWebP
      ? canvas.toDataURL('image/webp', 0.75)
      : canvas.toDataURL('image/jpeg', 0.5);
    // Detener cámara tras captura
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    onCapture(dataUrl);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (capturedPhoto) {
    return (
      <div style={mediaPanelStyles.previewContainer}>
        <img src={capturedPhoto} alt="Captura" style={mediaPanelStyles.previewImage} />
        <div style={mediaPanelStyles.previewActions}>
          <button style={mediaPanelStyles.retakeBtn} onClick={() => onCapture(null)}>
            <RotateCcw size={16} /> Tomar otra
          </button>
          <button style={mediaPanelStyles.confirmMediaBtn} onClick={onClose}>
            <CheckCircle size={16} /> Confirmar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={mediaPanelStyles.captureContainer}>
      {error ? (
        <div style={mediaPanelStyles.errorBox}>{error}</div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted style={mediaPanelStyles.videoPreview} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {!cameraReady && (
            <div style={mediaPanelStyles.loadingOverlay}>
              <Loader2 size={32} className="animate-spin" color="#00d2ff" />
              <span style={{ marginTop: 8, color: '#94a3b8', fontSize: '0.8rem' }}>Iniciando cámara...</span>
            </div>
          )}
        </>
      )}
      <div style={mediaPanelStyles.controlBar}>
        <button style={mediaPanelStyles.switchBtn} onClick={switchCamera}>
          <RotateCcw size={18} />
        </button>
        <button style={mediaPanelStyles.shutterBtn} onClick={takeSnapshot} disabled={!cameraReady}>
          <div style={mediaPanelStyles.shutterInner} />
        </button>
        <button style={mediaPanelStyles.switchBtn} onClick={onClose}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Grabación de Video con Cámara + Micrófono
// ============================================================================
const VideoCapturePanel = ({ onCapture, onClose, capturedVideo }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!capturedVideo) {
      startCamera();
    }
    return () => {
      stopEverything();
    };
  }, [capturedVideo]);

  const startCamera = async () => {
    setCameraReady(false);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 320 }, height: { ideal: 240 } },
        audio: { sampleRate: 22050, channelCount: 1 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      console.error('Error al acceder a cámara/micrófono:', err);
      setError('No se pudo acceder a la cámara o micrófono. Verifique los permisos.');
    }
  };

  const stopEverything = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const MAX_VIDEO_SECONDS = 15; // Límite de 15 segundos para mantener tamaño reducido

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    
    // Selección de MIME Type (MP4 para iOS/Safari, WebM para Android/Chrome)
    const mimeType = MediaRecorder.isTypeSupported('video/mp4') 
      ? 'video/mp4' 
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8') 
        ? 'video/webm;codecs=vp8' 
        : 'video/webm';

    const options = { 
      mimeType, 
      videoBitsPerSecond: 200000 // Reducido ligeramente para asegurar que quepa en localStorage
    };

    const recorder = new MediaRecorder(streamRef.current, options);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const finalBlob = new Blob(chunksRef.current, { type: mimeType });
      if (finalBlob.size === 0) {
        alert("Error: El video se grabó vacío. Intente nuevamente.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        // Validamos que el base64 tenga contenido real
        if (base64.length < 100) {
           alert("Error en la codificación del video.");
           return;
        }
        onCapture(base64);
      };
      reader.readAsDataURL(finalBlob);
      stopEverything();
    };

    recorderRef.current = recorder;
    recorder.start(500); // Timeslice cada 500ms asegura captura continua en móviles
    setRecording(true);
    setRecordTime(0);
    timerRef.current = setInterval(() => {
      setRecordTime(prev => {
        if (prev + 1 >= MAX_VIDEO_SECONDS) {
          // Auto-detener al llegar al límite
          stopRecording();
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (capturedVideo) {
    return (
      <div style={mediaPanelStyles.previewContainer}>
        <video 
           key={capturedVideo.substring(0, 100)} // Forzar re-render si cambia el video
           controls 
           autoPlay 
           muted 
           playsInline
           style={{...mediaPanelStyles.previewImage, objectFit: 'contain', background: '#000', minHeight: '200px'}} 
        >
           <source src={capturedVideo} type="video/mp4" />
           <source src={capturedVideo} type="video/webm" />
        </video>
        <div style={mediaPanelStyles.previewActions}>
          <button style={mediaPanelStyles.retakeBtn} onClick={() => onCapture(null)}>
            <RotateCcw size={16} /> Grabar otro
          </button>
          <button style={mediaPanelStyles.confirmMediaBtn} onClick={onClose}>
            <CheckCircle size={16} /> Confirmar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={mediaPanelStyles.captureContainer}>
      {error ? (
        <div style={mediaPanelStyles.errorBox}>{error}</div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted style={mediaPanelStyles.videoPreview} />
          {!cameraReady && (
            <div style={mediaPanelStyles.loadingOverlay}>
              <Loader2 size={32} className="animate-spin" color="#00d2ff" />
              <span style={{ marginTop: 8, color: '#94a3b8', fontSize: '0.8rem' }}>Iniciando cámara...</span>
            </div>
          )}
          {recording && (
            <div style={mediaPanelStyles.recordIndicator}>
              <CircleDot size={14} color="#ef4444" style={{ animation: 'pulse 1s infinite' }} />
              <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem' }}>REC {formatTime(recordTime)} / {formatTime(MAX_VIDEO_SECONDS)}</span>
            </div>
          )}
        </>
      )}
      <div style={mediaPanelStyles.controlBar}>
        <button style={mediaPanelStyles.switchBtn} onClick={onClose}>
          <X size={18} />
        </button>
        {!recording ? (
          <button style={{...mediaPanelStyles.shutterBtn, borderColor: '#ef4444'}} onClick={startRecording} disabled={!cameraReady}>
            <div style={{...mediaPanelStyles.shutterInner, background: '#ef4444'}} />
          </button>
        ) : (
          <button style={{...mediaPanelStyles.shutterBtn, borderColor: '#ef4444'}} onClick={stopRecording}>
            <StopCircle size={30} color="#ef4444" />
          </button>
        )}
        <div style={{ width: 44 }} /> {/* spacer */}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Grabación de Audio con Micrófono
// ============================================================================
const AudioCapturePanel = ({ onCapture, onClose, capturedAudio }) => {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Audio analyser for visual feedback
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        setAudioLevel(avg / 128);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const MAX_AUDIO_SECONDS = 30; // Límite de 30 segundos

      chunksRef.current = [];
      // Opus = el codec de audio más eficiente disponible en navegadores
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm';
      // Bitrate ultra bajo: 16kbps = ~60KB por 30 seg
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 16000 });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          onCapture(reader.result);
        };
        reader.readAsDataURL(blob);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      };
      recorderRef.current = recorder;
      recorder.start(1000);
      setRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => {
        setRecordTime(prev => {
          if (prev + 1 >= MAX_AUDIO_SECONDS) {
            stopRecording();
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
      setError('No se pudo acceder al micrófono. Verifique los permisos.');
    }
  };

  const stopRecording = () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (capturedAudio) {
    return (
      <div style={mediaPanelStyles.previewContainer}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={36} color="#10b981" />
          </div>
          <audio src={capturedAudio} controls style={{ width: '100%', maxWidth: 300 }} />
        </div>
        <div style={mediaPanelStyles.previewActions}>
          <button style={mediaPanelStyles.retakeBtn} onClick={() => onCapture(null)}>
            <RotateCcw size={16} /> Grabar otro
          </button>
          <button style={mediaPanelStyles.confirmMediaBtn} onClick={onClose}>
            <CheckCircle size={16} /> Confirmar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...mediaPanelStyles.captureContainer, background: '#020617' }}>
      {error ? (
        <div style={mediaPanelStyles.errorBox}>{error}</div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 30 }}>
          {/* Visual Audio Level Indicator */}
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: recording
              ? `radial-gradient(circle, rgba(239,68,68,${0.15 + audioLevel * 0.3}) 0%, transparent 70%)`
              : 'rgba(255,255,255,0.03)',
            border: recording ? '3px solid #ef4444' : '3px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease',
            transform: recording ? `scale(${1 + audioLevel * 0.15})` : 'scale(1)',
            boxShadow: recording ? `0 0 ${30 + audioLevel * 40}px rgba(239,68,68,${0.2 + audioLevel * 0.3})` : 'none'
          }}>
            <Mic size={44} color={recording ? '#ef4444' : '#64748b'} />
          </div>
          
          {recording ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'white', fontFamily: 'monospace' }}>{formatTime(recordTime)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CircleDot size={12} color="#ef4444" style={{ animation: 'pulse 1s infinite' }} />
                <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: 1 }}>GRABANDO AUDIO</span>
              </div>
            </div>
          ) : (
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Pulse para iniciar grabación</span>
          )}
        </div>
      )}
      <div style={mediaPanelStyles.controlBar}>
        <button style={mediaPanelStyles.switchBtn} onClick={onClose}>
          <X size={18} />
        </button>
        {!recording ? (
          <button style={{...mediaPanelStyles.shutterBtn, borderColor: '#ef4444'}} onClick={startRecording}>
            <Mic size={24} color="#ef4444" />
          </button>
        ) : (
          <button style={{...mediaPanelStyles.shutterBtn, borderColor: '#ef4444'}} onClick={stopRecording}>
            <StopCircle size={30} color="#ef4444" />
          </button>
        )}
        <div style={{ width: 44 }} />
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Lector QR ultra-rápido (BarcodeDetector nativo + jsQR fallback)
// ============================================================================
const FastQRScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const scannedRef = useRef(false); // Evitar escaneos duplicados
  const lastScanValueRef = useRef('');
  const lastScanTimeRef = useRef(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan; // Siempre mantener la referencia actualizada

  useEffect(() => {
    let cancelled = false;
    let detector = null;

    // Intentar inicializar BarcodeDetector nativo
    if ('BarcodeDetector' in window) {
      try {
        detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        console.log('[QR] BarcodeDetector nativo disponible');
      } catch (e) {
        detector = null;
        console.log('[QR] BarcodeDetector no soportado, usando jsQR');
      }
    } else {
      console.log('[QR] BarcodeDetector no existe en este navegador, usando jsQR');
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');

        await video.play();
        if (cancelled) return;

        setReady(true);
        console.log(`[QR] Cámara lista: ${video.videoWidth}x${video.videoHeight}`);

        // Iniciar loop de escaneo con setInterval (más confiable que rAF)
        intervalRef.current = setInterval(() => {
          if (cancelled || scannedRef.current) return;
          scanFrame(video, detector);
        }, 150); // ~7 escaneos por segundo — óptimo para QR

      } catch (err) {
        console.error('[QR] Error cámara:', err);
        if (!cancelled) setError('No se pudo acceder a la cámara. Verifique los permisos.');
      }
    };

    const scanFrame = async (video, nativeDetector) => {
      if (!video || video.readyState < 2 || scannedRef.current) return;

      // ═══ MÉTODO 1: BarcodeDetector nativo (Android Chrome) ═══
      if (nativeDetector) {
        try {
          const barcodes = await nativeDetector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleDetected(barcodes[0].rawValue);
            return;
          }
        } catch (e) {
          // Silently fall through to jsQR
        }
      }

      // ═══ MÉTODO 2: jsQR via canvas (todos los navegadores) ═══
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w === 0 || h === 0) return;

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, w, h, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          handleDetected(code.data);
          return;
        }
      } catch (e) {
        console.error('[QR] Error jsQR:', e);
      }
    };


    const handleDetected = (value) => {
      const now = Date.now();
      // Si escaneamos lo MISMO en los últimos 2 segundos, ignorar (evitar spam)
      if (value === lastScanValueRef.current && now - lastScanTimeRef.current < 2000) return;
      
      lastScanValueRef.current = value;
      lastScanTimeRef.current = now;

      console.log('[QR] ¡Detectado!:', value);
      if (navigator.vibrate) navigator.vibrate([100]); // Feedback ligero

      // Nota: NO detenemos el intervalo aquí. El scanner sigue corriendo.
      // Si es un escaneo exitoso, el componente padre (StaffApp) cerrará el modal apagando este componente en crudo.
      
      onScanRef.current(value);
    };

    startCamera();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 15, left: 15, right: 15, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ background: 'rgba(0,0,0,0.7)', padding: '6px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold', color: 'white', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QrCode size={16} color="#00d2ff" />
          {ready ? 'Apunte al código QR' : 'Iniciando cámara...'}
        </span>
        <button
          onClick={onClose}
          style={{ background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(5px)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Retícula de enfoque animada */}
      {ready && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '220px', height: '220px', zIndex: 5
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '35px', height: '35px', borderTop: '4px solid #00d2ff', borderLeft: '4px solid #00d2ff', borderRadius: '4px 0 0 0' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '35px', height: '35px', borderTop: '4px solid #00d2ff', borderRight: '4px solid #00d2ff', borderRadius: '0 4px 0 0' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '35px', height: '35px', borderBottom: '4px solid #00d2ff', borderLeft: '4px solid #00d2ff', borderRadius: '0 0 0 4px' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '35px', height: '35px', borderBottom: '4px solid #00d2ff', borderRight: '4px solid #00d2ff', borderRadius: '0 0 4px 0' }} />
          <div style={{
            position: 'absolute', left: '10px', right: '10px', height: '2px',
            background: 'linear-gradient(90deg, transparent, #00d2ff, transparent)',
            animation: 'scanLine 1.5s ease-in-out infinite',
            boxShadow: '0 0 15px rgba(0,210,255,0.6)'
          }} />
          <style>{`
            @keyframes scanLine {
              0% { top: 10px; opacity: 0.6; }
              50% { top: calc(100% - 12px); opacity: 1; }
              100% { top: 10px; opacity: 0.6; }
            }
          `}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, color: '#ef4444', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(0,0,0,0.8)' }}>
          {error}
        </div>
      )}

      {/* Loader */}
      {!ready && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Loader2 size={32} color="#00d2ff" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Iniciando cámara...</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Estilos de los paneles de captura multimedia
// ============================================================================
const mediaPanelStyles = {
  captureContainer: {
    position: 'relative', width: '100%', height: 360,
    background: '#000', borderRadius: '16px', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', marginBottom: 15
  },
  videoPreview: {
    width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0
  },
  loadingOverlay: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', zIndex: 5
  },
  controlBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '15px 25px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', zIndex: 10
  },
  shutterBtn: {
    width: 60, height: 60, borderRadius: '50%', border: '4px solid white',
    background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.15s'
  },
  shutterInner: {
    width: 44, height: 44, borderRadius: '50%', background: 'white', transition: 'all 0.15s'
  },
  switchBtn: {
    width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
    border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', backdropFilter: 'blur(5px)'
  },
  recordIndicator: {
    position: 'absolute', top: 15, left: 15, display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: 8, zIndex: 10,
    backdropFilter: 'blur(5px)'
  },
  previewContainer: {
    borderRadius: '16px', overflow: 'hidden', background: '#0f172a',
    border: '1px solid rgba(255,255,255,0.1)', marginBottom: 15
  },
  previewImage: {
    width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block'
  },
  previewActions: {
    display: 'flex', gap: 10, padding: '12px 15px', justifyContent: 'center'
  },
  retakeBtn: {
    flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12, color: '#94a3b8', fontWeight: 'bold', fontSize: '0.8rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer'
  },
  confirmMediaBtn: {
    flex: 1, padding: '12px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981',
    borderRadius: 12, color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer'
  },
  errorBox: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 30, color: '#ef4444', fontSize: '0.9rem', textAlign: 'center'
  }
};

const StaffApp = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // 1. Estados Principales
  // 1. Estados Principales - PERSISTENCIA DE SESIÓN (REGLA DE ORO)
  const sessionKey = user ? `centinela_session_${user.uid || user.id}` : null;
  const [session, setSession] = useState(() => {
    if (sessionKey) {
      try {
        const saved = localStorage.getItem(sessionKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Session restore error:", e);
      }
    }
    return {
      isCheckedIn: false,
      inRuta: false,
      inRonda: false,
      rondaStartTime: null,
      activeRondaId: null,
      isEmergency: false
    };
  });

  // Guardar sesión automáticamente al cambiar
  useEffect(() => {
    if (sessionKey) {
      localStorage.setItem(sessionKey, JSON.stringify(session));
    }
  }, [session, sessionKey]);

  const [loading, setLoading] = useState(false);
  const [appReady, setAppReady] = useState(false); // Estado para evitar pantalla negra en inicio frío
  const { userLocationIcon, objectiveIcon } = getLeafletIcons();
  const [currentGps, setCurrentGps] = useState(null);
  const [companyName, setCompanyName] = useState('DASHBOARD');
  const [assignedObjectiveName, setAssignedObjectiveName] = useState('SIN ASIGNAR');
  const [assignedObjective, setAssignedObjective] = useState(null);
  const [qrPointsList, setQrPointsList] = useState([]);
  const [reportData, setReportData] = useState({ text: '', photo: false, video: false, audio: false });
  const [scannedPoints, setScannedPoints] = useState([]);
  const [scanningPointId, setScanningPointId] = useState(null);
  
  // Modales
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [fullUserData, setFullUserData] = useState(null);

  // Estados de Multimedia Capturada (datos reales)
  const [capturedPhoto, setCapturedPhoto] = useState(null);     // base64 data URL
  const [capturedVideo, setCapturedVideo] = useState(null);     // base64 data URL
  const [capturedAudio, setCapturedAudio] = useState(null);     // base64 data URL
  const [activeMediaPanel, setActiveMediaPanel] = useState(null); // 'photo' | 'video' | 'audio' | null

  // 2. Localización Real de Alta Precisión
  useEffect(() => {
    if (!user) return;
    
    // Timeout de seguridad: Si en 5 segundos nada carga, forzar appReady
    const timer = setTimeout(() => setAppReady(true), 5000);
    // Fetch Company Name
    try {
      const allCompanies = JSON.parse(localStorage.getItem('centinela_companies') || '[]');
      const currentComp = allCompanies.find(c => c.id === user.empresaId);
      if (currentComp) setCompanyName(currentComp.nombre || currentComp.name || user.company || 'DASHBOARD');
      else if (user.company) setCompanyName(user.company);
    } catch (e) {
      console.warn("Storage error (companies):", e);
      if (user.company) setCompanyName(user.company);
    }

    // Fetch Assigned Objective
    try {
      const allUsers = JSON.parse(localStorage.getItem('centinela_users') || '[]');
      const currentUserData = allUsers.find(u => 
        (user.uid && (u.uid === user.uid || u.id === user.uid)) ||
        (user.id && (u.id === user.id || u.uid === user.id)) ||
        (user.email && u.email?.toLowerCase() === user.email?.toLowerCase())
      );
      setFullUserData(currentUserData);
      if (currentUserData && currentUserData.schedule && currentUserData.schedule.objectiveId) {
        const allObjectives = JSON.parse(localStorage.getItem('centinela_objectives') || '[]');
        const companyObjectives = [...OBJETIVOS_MOCK, ...allObjectives.filter(obj => obj.empresaId === user.empresaId)];
        const obj = companyObjectives.find(o => o.id === currentUserData.schedule.objectiveId);
        if (obj) {
            setAssignedObjectiveName(obj.nombre);
            setAssignedObjective(obj);
        }

        const allQr = JSON.parse(localStorage.getItem('centinela_qr_points') || '[]');
        setQrPointsList(allQr.filter(p => p.objectiveId === currentUserData.schedule.objectiveId));
      }
    } catch (e) {
      console.warn("Storage error (users/objectives):", e);
    }

    // Geolocation API (Real Tracking)
    let watchId;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setCurrentGps({ lat, lng });
          
          // REGLA DE ORO: Siempre mostrar ubicación real.
          // Enviamos al backend si hay usuario, sin importar el isCheckedIn para visibilidad total.
          if (user?.uid || user?.id) {
            await actualizarUbicacionGPS(user.empresaId, user.uid || user.id, lat, lng);
          }
        },
        (error) => {
          console.error("GPS Error critical: Real location required.", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    
    setAppReady(true);
    
    return () => { 
      if(watchId) navigator.geolocation.clearWatch(watchId); 
      clearTimeout(timer);
    };
  }, [user, session.isCheckedIn, assignedObjective]);

  // 3. Handlers
  const handleToggleTurno = async () => {
    setLoading(true);
    const newStatus = !session.isCheckedIn;
    try {
      const userEmbed = {
        legajo: fullUserData?.legajo || 'G-000',
        nombre: fullUserData?.nombre || user?.nombre || 'Guardia',
        apellido: fullUserData?.apellido || user?.apellido || '',
        email: fullUserData?.email || user?.email || '',
        telefono: fullUserData?.telefono || ''
      };

      await crearEvento(user.empresaId, {
        usuario: userEmbed,
        usuarioId: user.uid || user.id,
        tipo: newStatus ? 'ingreso' : 'egreso',
        objetivoId: assignedObjective?.id || 'base',
        objetivoNombre: assignedObjective?.nombre || 'General',
        gps: currentGps ? `${currentGps.lat},${currentGps.lng}` : "0,0",
        lat: currentGps ? parseFloat(currentGps.lat) : 0,
        lng: currentGps ? parseFloat(currentGps.lng) : 0,
        hora: new Date().toLocaleTimeString(),
        manual: false
      });
      setSession(prev => ({ ...prev, isCheckedIn: newStatus, inRuta: false, inRonda: false }));
      alert(newStatus ? "✅ Turno Iniciado" : "🚪 Turno Finalizado");
    } catch (e) {
      alert("Error: " + e.message);
    } finally { setLoading(false); }
  };

  const handlePanic = async () => {
    if (confirm("🚨 ¿CONFIRMA ALERTA DE PÁNICO? 🚨")) {
      try {
        const userEmbed = {
          legajo: fullUserData?.legajo || 'G-000',
          nombre: fullUserData?.nombre || user?.nombre || 'Guardia',
          apellido: fullUserData?.apellido || '',
          email: fullUserData?.email || user?.email || '',
          telefono: fullUserData?.telefono || ''
        };

        const gpsStr = currentGps ? `${currentGps.lat},${currentGps.lng}` : "0,0";
        await crearEvento(user.empresaId, { 
          tipo: 'emergencia', 
          usuario: userEmbed, 
          objetivoId: assignedObjective?.id || 'ubicacion_gps',
          gps: gpsStr,
          lat: currentGps ? parseFloat(currentGps.lat) : 0,
          lng: currentGps ? parseFloat(currentGps.lng) : 0
        });
        alert("🚨 ALERTA ENVIADA.");
      } catch (e) { 
        console.error("Error en pánico:", e);
        alert("Error al enviar alerta: " + (e.message || "Error desconocido")); 
      }
    }
  };

  const handleStartRonda = async () => {
    setLoading(true);
    try {
      const gpsStr = currentGps ? `${currentGps.lat},${currentGps.lng}` : "0,0";
      const id = await iniciarRonda({ 
        guardiaId: user.uid, 
        empresaId: user.empresaId, 
        gpsInicio: gpsStr,
        lat: currentGps ? parseFloat(currentGps.lat) : 0,
        lng: currentGps ? parseFloat(currentGps.lng) : 0
      });
      setSession(prev => ({ ...prev, inRonda: true, activeRondaId: id, rondaStartTime: new Date().toLocaleTimeString() }));
    } catch (e) { 
      console.error("Error al iniciar ronda:", e);
      alert("Error al iniciar ronda: " + (e.message || "Error desconocido")); 
    } finally { setLoading(false); }
  };

  const handleEndRonda = async () => {
    setLoading(true);
    try {
      const gpsStr = currentGps ? `${currentGps.lat},${currentGps.lng}` : "0,0";
      
      // Crear evento de fin de ronda para consistencia con rondas QR
      await crearEvento(user.empresaId, {
          usuario: {
            legajo: fullUserData?.legajo || 'G-000',
            nombre: fullUserData?.nombre || user?.nombre || 'Guardia',
            apellido: fullUserData?.apellido || user?.apellido || '',
            email: fullUserData?.email || user?.email || '',
            telefono: fullUserData?.telefono || ''
          },
          tipo: 'ronda_completada',
          objetivoId: assignedObjective?.id,
          objetivoNombre: assignedObjectiveName,
          gps: gpsStr,
          lat: currentGps ? parseFloat(currentGps.lat) : 0,
          lng: currentGps ? parseFloat(currentGps.lng) : 0,
          descripcion: `Ronda Libre Finalizada exitosamente.`,
          inicio: session.rondaStartTime || "S/I",
          fin: new Date().toLocaleTimeString(),
          hora: new Date().toLocaleTimeString()
      });

      await finalizarRonda(session.activeRondaId);
      setSession(prev => ({ ...prev, inRonda: false, activeRondaId: null }));
    } catch (e) { 
      console.error("Error al finalizar ronda:", e);
      alert("Error al finalizar ronda: " + (e.message || "Error desconocido")); 
    } finally { setLoading(false); }
  };

  // Handler para cerrar el modal de reporte limpiando todo
  const handleCloseReport = () => {
    setActiveMediaPanel(null);
    setShowReportModal(false);
  };

  const isLocked = !session.isCheckedIn || session.isEmergency;

  // Verificar si hay contenido multimedia o texto para habilitar envío
  const hasReportContent = reportData.text || capturedPhoto || capturedVideo || capturedAudio;

  if (!appReady) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={40} className="animate-spin" color="#00a8ff" />
        <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold' }}>SINCRONIZANDO CENTINELA...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.phoneFrame}>
        
        <header style={styles.header}>
            <h1 style={styles.logo}>CENTINELA</h1>
            <div style={{ color: '#00a8ff', fontSize: '0.6rem', letterSpacing: '2px', fontWeight: 'bold', marginTop: '-2px', textTransform: 'uppercase' }}>
              {companyName}
            </div>
            <span style={{...styles.geofenceTag, color: session.isCheckedIn ? '#10b981' : '#94a3b8'}}>
              {session.isCheckedIn ? '● DENTRO DE PERÍMETRO' : '○ ESPERANDO INICIO DE TURNO'}
            </span>
        </header>

        {/* VISTA DE MAPA TÁCTICO */}
        <div style={styles.mapContainer}>
            <div style={styles.mapViewport}>
               {/* Overlay de HUD sobre el mapa */}
               <div style={styles.hudOverlay}>
                  <span style={styles.hudBadge}>RADAR EN VIVO</span>
                  <div style={styles.hudCords}>
                    <Navigation size={10} /> {currentGps ? `${currentGps.lat}, ${currentGps.lng}` : "Localizando..."}
                  </div>
               </div>

               {/* Leyenda Objetivo Asignado */}
               <div style={styles.hudObjective}>
                  OBJETIVO: <span style={{ color: 'white' }}>{assignedObjectiveName}</span>
               </div>
               
               {/* Mapa Real en Vivo (Google Maps Blue Dot Style) */}
               <div style={styles.mapGraphic}>
                  <MapContainer 
                     center={currentGps ? [parseFloat(currentGps.lat), parseFloat(currentGps.lng)] : [-34.6037, -58.3816]} 
                     zoom={15} 
                     style={{ height: '100%', width: '100%' }}
                     zoomControl={true}
                  >
                     <TileLayer
                       attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                     />
                     <ChangeView center={currentGps ? [parseFloat(currentGps.lat), parseFloat(currentGps.lng)] : null} zoom={16} />
                     
                     {/* Marcador Usuario (Blue Dot) */}
                     {currentGps && (
                        <Marker position={[parseFloat(currentGps.lat), parseFloat(currentGps.lng)]} icon={userLocationIcon}>
                           <Popup>
                              <div style={{ color: 'black', fontSize: '12px' }}>
                                 <strong>MI POSICIÓN</strong><br/>
                                 Lectura Satelital en Tiempo Real<br/>
                                 {new Date().toLocaleTimeString()}
                              </div>
                           </Popup>
                        </Marker>
                     )}

                     {/* Marcador Objetivo Asignado (Con Nombre de Puesto Visible) */}
                     {assignedObjective && assignedObjective.lat && assignedObjective.lng && (
                        <Marker 
                          position={[assignedObjective.lat, assignedObjective.lng]} 
                          icon={L.divIcon({
                            className: 'custom-objective-marker',
                            html: `
                              <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                                <div style="background: white; padding: 4px 10px; border-radius: 8px; border: 2px solid #3b82f6; box-shadow: 0 4px 10px rgba(0,0,0,0.3); margin-bottom: 5px; white-space: nowrap; transform: translateY(-5px);">
                                  <span style="font-size: 10px; font-weight: 900; color: #1e293b; text-transform: uppercase;">${assignedObjective.nombre}</span>
                                </div>
                                <div style="width: 12px; height: 12px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
                              </div>
                            `,
                            iconSize: [120, 40],
                            iconAnchor: [60, 20]
                          })}
                        >
                           <Popup>
                              <div style={{ color: 'black', fontSize: '12px', minWidth: '150px' }}>
                                 <strong style={{textTransform: 'uppercase'}}>{assignedObjective.nombre}</strong><br/>
                                 <div style={{marginTop: '5px', color: '#10b981', fontWeight: 'bold'}}>DIRECCIÓN:</div>
                                 <div style={{fontSize: '11px', color: '#1e293b', marginBottom: '8px'}}>{assignedObjective.address}</div>
                                 <hr style={{margin: '5px 0', opacity: 0.1}}/>
                                 <div style={{fontSize: '10px', color: '#64748b', marginTop: '3px'}}>Ubicación pactada para el servicio.</div>
                              </div>
                           </Popup>
                        </Marker>
                     )}
                  </MapContainer>
               </div>

               <button style={styles.mapExpandBtn} onClick={() => alert("Maximizando Mapa Táctico...")}>
                  <LocateFixed size={20} />
               </button>
            </div>
        </div>

        {/* 1. BOTONES PRINCIPALES */}
        <div style={{...styles.opsGrid, marginBottom: '15px'}}>
           <button 
             style={{...styles.mainButton, backgroundColor: session.isCheckedIn ? '#ef4444' : '#3b82f6', gridColumn: 'span 3'}}
             onClick={handleToggleTurno}
             disabled={loading}
           >
             {loading ? <Loader2 className="animate-spin" /> : (session.isCheckedIn ? '🔴 FINALIZAR TURNO' : '🔵 INICIAR TURNO')}
           </button>
        </div>

        {/* 2. BOTÓN DE PÁNICO */}
        <div style={styles.section}>
          <button 
            style={{...styles.panicButton, opacity: session.isCheckedIn ? 1 : 0.4}} 
            onClick={handlePanic}
            disabled={!session.isCheckedIn}
          >
            <ShieldAlert size={40} />
            🚨 BOTÓN DE PÁNICO 🚨
          </button>
        </div>

        {/* MENÚ DE OPERACIONES */}
        <div style={{...styles.opsGrid, opacity: isLocked ? 0.3 : 1, pointerEvents: isLocked ? 'none' : 'auto'}}>
          
          <HighImpactButton 
            icon={<MapIcon size={28} />} 
            label={session.inRuta ? "EN RECORRIDO" : "INICIAR RUTA"} 
            color="#3b82f6"
            onClick={() => {
                setSession(prev => ({...prev, inRuta: true, rondaStartTime: new Date().toLocaleTimeString()}));
                setShowTourModal(true);
            }}
          />

          <HighImpactButton 
            icon={session.inRonda ? <Square size={28} /> : <Play size={28} />} 
            label={session.inRonda ? "FINALIZAR" : "RONDA LIBRE"} 
            color="#f59e0b"
            onClick={session.inRonda ? handleEndRonda : handleStartRonda}
          />

          <HighImpactButton 
            icon={<Camera size={28} />} 
            label="INFORME" 
            color="#10b981"
            onClick={() => setShowReportModal(true)}
          />

        </div>

        {(session.inRuta || session.inRonda) && (
          <div className="fade-in" style={styles.statusBanner}>
            <Zap size={16} className="animate-spin" color="#f59e0b" />
            <span>SISTEMA DE RASTREO ACTIVO</span>
          </div>
        )}

        <div style={styles.logSection}>
          <div style={styles.logList}>
             <ActivityItem time="Ahora" text="Equipo en línea / GPS Activo" />
             {session.isCheckedIn && <ActivityItem time="Turno" text="Turno iniciado correctamente" active />}
          </div>
        </div>

         <footer style={styles.footer}>
           <button onClick={logout} style={styles.logoutBtn}>
             <LogOut size={16} /> FINALIZAR SESIÓN DE {user?.nombre?.toUpperCase()}
           </button>
         </footer>

      </div>

      {/* MODALES */}
      {showReportModal && (
        <div className="modal-overlay" style={styles.modalOverlay} onClick={handleCloseReport}>
          <div className="modal-content glass fade-up" style={{...styles.reportModal, maxHeight: '92vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>📸 REPORTE DE EVIDENCIA</h3>
              <button style={styles.closeBtn} onClick={handleCloseReport}><X /></button>
            </div>

            {/* ── Panel de captura multimedia activo ── */}
            {activeMediaPanel === 'photo' && (
              <PhotoCapturePanel
                capturedPhoto={capturedPhoto}
                onCapture={(data) => {
                  setCapturedPhoto(data);
                  setReportData(prev => ({...prev, photo: !!data}));
                }}
                onClose={() => setActiveMediaPanel(null)}
              />
            )}
            {activeMediaPanel === 'video' && (
              <VideoCapturePanel
                capturedVideo={capturedVideo}
                onCapture={(data) => {
                  setCapturedVideo(data);
                  setReportData(prev => ({...prev, video: !!data}));
                }}
                onClose={() => setActiveMediaPanel(null)}
              />
            )}
            {activeMediaPanel === 'audio' && (
              <AudioCapturePanel
                capturedAudio={capturedAudio}
                onCapture={(data) => {
                  setCapturedAudio(data);
                  setReportData(prev => ({...prev, audio: !!data}));
                }}
                onClose={() => setActiveMediaPanel(null)}
              />
            )}

            {/* ── Grilla de botones multimedia ── */}
            {!activeMediaPanel && (
              <>
                <div style={styles.multimediaGrid}>
                  <button 
                     style={{
                       ...styles.mediaBtn,
                       background: capturedPhoto ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                       color: capturedPhoto ? '#10b981' : 'white',
                       border: capturedPhoto ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                       position: 'relative'
                     }} 
                     onClick={() => {
                       if (capturedPhoto) {
                         // Ya hay foto: mostrar preview
                         setActiveMediaPanel('photo');
                       } else {
                         setActiveMediaPanel('photo');
                       }
                     }}
                  >
                     <Camera size={22} />
                     <span style={{ fontSize: '0.75rem' }}>{capturedPhoto ? '✓ ADJUNTADA' : 'FOTO'}</span>
                     {capturedPhoto && (
                       <button
                         onClick={(e) => { e.stopPropagation(); setCapturedPhoto(null); setReportData(prev => ({...prev, photo: false})); }}
                         style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                       >
                         <Trash2 size={11} color="white" />
                       </button>
                     )}
                  </button>
                  <button 
                     style={{
                       ...styles.mediaBtn,
                       background: capturedVideo ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                       color: capturedVideo ? '#10b981' : 'white',
                       border: capturedVideo ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                       position: 'relative'
                     }} 
                     onClick={() => setActiveMediaPanel('video')}
                  >
                     <Video size={22} />
                     <span style={{ fontSize: '0.75rem' }}>{capturedVideo ? '✓ ADJUNTADO' : 'VIDEO'}</span>
                     {capturedVideo && (
                       <button
                         onClick={(e) => { e.stopPropagation(); setCapturedVideo(null); setReportData(prev => ({...prev, video: false})); }}
                         style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                       >
                         <Trash2 size={11} color="white" />
                       </button>
                     )}
                  </button>
                  <button 
                     style={{
                       ...styles.mediaBtn,
                       background: capturedAudio ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                       color: capturedAudio ? '#10b981' : 'white',
                       border: capturedAudio ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                       position: 'relative'
                     }} 
                     onClick={() => setActiveMediaPanel('audio')}
                  >
                     <Mic size={22} />
                     <span style={{ fontSize: '0.75rem' }}>{capturedAudio ? '✓ GRABADO' : 'AUDIO'}</span>
                     {capturedAudio && (
                       <button
                         onClick={(e) => { e.stopPropagation(); setCapturedAudio(null); setReportData(prev => ({...prev, audio: false})); }}
                         style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                       >
                         <Trash2 size={11} color="white" />
                       </button>
                     )}
                  </button>
                </div>

                {/* Miniaturas de contenido adjuntado */}
                {(capturedPhoto || capturedVideo || capturedAudio) && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap' }}>
                    {capturedPhoto && (
                      <div style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', border: '2px solid #10b981', position: 'relative', cursor: 'pointer' }}
                           onClick={() => setActiveMediaPanel('photo')}>
                        <img src={capturedPhoto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '2px 0', textAlign: 'center' }}>
                          <Camera size={10} color="#10b981" />
                        </div>
                      </div>
                    )}
                    {capturedVideo && (
                      <div style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', border: '2px solid #10b981', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                           onClick={() => setActiveMediaPanel('video')}>
                        <Video size={20} color="#10b981" />
                        <span style={{ fontSize: '0.5rem', color: '#10b981', marginTop: 4 }}>VIDEO</span>
                      </div>
                    )}
                    {capturedAudio && (
                      <div style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', border: '2px solid #10b981', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                           onClick={() => setActiveMediaPanel('audio')}>
                        <Mic size={20} color="#10b981" />
                        <span style={{ fontSize: '0.5rem', color: '#10b981', marginTop: 4 }}>AUDIO</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <textarea 
               style={styles.textArea} 
               placeholder="Describa la novedad detalladamente..." 
               rows={4} 
               value={reportData.text}
               onChange={e => setReportData({...reportData, text: e.target.value})}
            />
            <button 
               style={{...styles.confirmBtn, opacity: !hasReportContent ? 0.5 : 1}} 
               onClick={async () => {
                  if (!hasReportContent) {
                     return alert("Debe describir o adjuntar evidencia visual/sonora para enviar el reporte.");
                  }
                  try {
                     setLoading(true);
                     let desc = reportData.text || "Informe interactivo de terreno adjunto.";
                     let extra = [];
                     if (capturedPhoto) extra.push("1 Fotografía");
                     if (capturedVideo) extra.push("1 Grabación de Video");
                     if (capturedAudio) extra.push("1 Nota de Audio");
                     if (extra.length > 0) desc += `\n(Archivos adjuntos: ${extra.join(" | ")})`;

                     // Generar ID único para los adjuntos
                     const mediaId = 'media_' + Date.now();
                     const adjuntosRef = {};

                     // Guardar cada archivo multimedia en su propia clave de localStorage
                     // para no exceder el límite al meterlo todo en centinela_events
                     try {
                       if (capturedPhoto) {
                         localStorage.setItem(`centinela_${mediaId}_foto`, capturedPhoto);
                         adjuntosRef.foto = `centinela_${mediaId}_foto`;
                       }
                       if (capturedVideo) {
                         localStorage.setItem(`centinela_${mediaId}_video`, capturedVideo);
                         adjuntosRef.video = `centinela_${mediaId}_video`;
                       }
                       if (capturedAudio) {
                         localStorage.setItem(`centinela_${mediaId}_audio`, capturedAudio);
                         adjuntosRef.audio = `centinela_${mediaId}_audio`;
                       }
                     } catch (storageErr) {
                       console.warn('localStorage lleno, limpiando medios antiguos...', storageErr);
                       // Limpiar medios más antiguos si localStorage está lleno
                       const keysToRemove = [];
                       for (let i = 0; i < localStorage.length; i++) {
                         const key = localStorage.key(i);
                         if (key && key.startsWith('centinela_media_')) keysToRemove.push(key);
                       }
                       // Eliminar los más antiguos (primeros 10)
                       keysToRemove.slice(0, 10).forEach(k => localStorage.removeItem(k));
                       // Reintentar
                       if (capturedPhoto) { localStorage.setItem(`centinela_${mediaId}_foto`, capturedPhoto); adjuntosRef.foto = `centinela_${mediaId}_foto`; }
                       if (capturedVideo) { localStorage.setItem(`centinela_${mediaId}_video`, capturedVideo); adjuntosRef.video = `centinela_${mediaId}_video`; }
                       if (capturedAudio) { localStorage.setItem(`centinela_${mediaId}_audio`, capturedAudio); adjuntosRef.audio = `centinela_${mediaId}_audio`; }
                     }

                     await crearEvento(user.empresaId, {
                        usuario: {
                          legajo: fullUserData?.legajo || 'G-000',
                          nombre: fullUserData?.nombre || user?.nombre || 'Guardia',
                          apellido: fullUserData?.apellido || '',
                          email: fullUserData?.email || user?.email || '',
                          telefono: fullUserData?.telefono || ''
                        },
                        tipo: 'informe',
                        objetivoId: assignedObjective?.id,
                        gps: currentGps ? `${currentGps.lat},${currentGps.lng}` : '0,0',
                        lat: currentGps ? parseFloat(currentGps.lat) : 0,
                        lng: currentGps ? parseFloat(currentGps.lng) : 0,
                        descripcion: desc,
                        adjuntos: Object.keys(adjuntosRef).length > 0 ? adjuntosRef : undefined,
                        hora: new Date().toLocaleTimeString()
                     });

                     alert("✅ REPORTE ENVIADO. El centro de operaciones ha recibido la evidencia exitosamente.");
                     setReportData({ text: '', photo: false, video: false, audio: false });
                     setCapturedPhoto(null);
                     setCapturedVideo(null);
                     setCapturedAudio(null);
                     setActiveMediaPanel(null);
                     setShowReportModal(false);
                  } catch (e) {
                     console.error('Error en envío de reporte:', e);
                     alert("Error en el envío: " + (e.message || e));
                  } finally {
                     setLoading(false);
                  }
               }}
            >
              {loading ? <Loader2 className="animate-spin" /> : "ENVIAR REPORTE AL COMANDO"}
            </button>
          </div>
        </div>
      )}

       {showTourModal && (
        <div className="modal-overlay" style={styles.modalOverlay} onClick={() => { if(!scanningPointId) setShowTourModal(false); }}>
          <div className="modal-content glass fade-up" style={{...styles.reportModal, padding: scanningPointId ? '0' : '25px', overflow: 'hidden'}} onClick={e => e.stopPropagation()}>
             {!scanningPointId ? (
                <>
                   <div style={styles.modalHeader}>
                      <h3>🗺 RUTA: {assignedObjectiveName}</h3>
                       <button style={styles.closeBtn} onClick={() => setShowTourModal(false)}><X /></button>
                   </div>
                   <div style={styles.routeInfo}>
                      {qrPointsList.length === 0 ? (
                         <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                            <QrCode size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                            <br/>No hay puntos de control QR programados para escanear en {assignedObjectiveName}.
                         </div>
                      ) : (
                         qrPointsList.map((pt) => {
                            const isScanned = scannedPoints.includes(pt.id);
                            return (
                               <div key={pt.id} style={{...styles.routePoint, opacity: isScanned ? 0.6 : 1}}>
                                 {isScanned ? <CheckCircle size={18} color="#10b981" /> : <Clock size={18} color="#f59e0b" />}
                                 <div style={{ flex: 1 }}>
                                   <p style={{fontWeight: 'bold', fontSize: '0.9rem', color: isScanned ? "#10b981" : "white", margin: 0, marginBottom: '2px'}}>{pt.name}</p>
                                   <p style={{fontSize: '0.7rem', color: isScanned ? "#10b981" : 'rgba(255,255,255,0.4)', margin: 0}}>{isScanned ? 'Escaneado Exitosamente' : 'Pendiente'}</p>
                                 </div>
                                 {!isScanned && (
                                    <button 
                                       style={styles.qrBtn} 
                                       onClick={() => setScanningPointId(pt.id)}
                                    >
                                       <QrCode size={16} /> QR
                                    </button>
                                 )}
                               </div>
                            )
                         })
                      )}
                   </div>
                   
                   {(qrPointsList.length > 0 && scannedPoints.length === qrPointsList.length) ? (
                      <button 
                         style={{...styles.confirmBtn, background: '#10b981', color: 'white', marginTop: '15px'}} 
                         onClick={async () => {
                             try {
                                 setLoading(true);
                                 const gpsStr = currentGps ? `${currentGps.lat},${currentGps.lng}` : "0,0";
                                 await crearEvento(user.empresaId, {
                                     usuario: {
                                        legajo: fullUserData?.legajo || 'G-000',
                                        nombre: fullUserData?.nombre || user?.nombre || 'Guardia',
                                        apellido: fullUserData?.apellido || '',
                                        email: fullUserData?.email || user?.email || '',
                                        telefono: fullUserData?.telefono || ''
                                     },
                                     tipo: 'ronda_completada',
                                     objetivoId: assignedObjective?.id,
                                     objetivoNombre: assignedObjectiveName,
                                     gps: gpsStr,
                                     lat: currentGps ? parseFloat(currentGps.lat) : 0,
                                     lng: currentGps ? parseFloat(currentGps.lng) : 0,
                                     descripcion: `100% Ronda QR Completada: ${scannedPoints.length}/${qrPointsList.length} puntos. Objetivo: ${assignedObjectiveName}`,
                                     puntos: qrPointsList.map(pt => ({
                                        id: pt.id,
                                        nombre: pt.name,
                                        escaneado: scannedPoints.includes(pt.id)
                                     })),
                                     inicio: session.rondaStartTime || "S/I",
                                  fin: new Date().toLocaleTimeString(),
                                  hora: new Date().toLocaleTimeString()
                                 });
                                 alert("✅ RONDA COMPLETADA Y ENVIADA CON ÉXITO.");
                                 setScannedPoints([]);
                                 setShowTourModal(false);
                                 if (session.inRonda) {
                                     await finalizarRonda(session.activeRondaId);
                                     setSession(prev => ({ ...prev, inRonda: false, activeRondaId: null, inRuta: false }));
                                 } else {
                                     setSession(prev => ({ ...prev, inRuta: false }));
                                 }
                             } catch(e) {
                                  console.error("Error enviando datos de la ronda:", e);
                                  alert("Error enviando datos de la ronda: " + (e.message || "Error desconocido"));
                             } finally {
                                  setLoading(false);
                             }
                         }}
                      >
                         {loading ? <Loader2 className="animate-spin" /> : "FINALIZAR Y ENVIAR RONDA"}
                      </button>
                   ) : (
                      <button style={{...styles.confirmBtn, marginTop: '15px'}} onClick={() => setShowTourModal(false)}>CERRAR VENTANA</button>
                   )}
                </>
             ) : (
                <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                  <FastQRScanner
                     onScan={(rawValue) => {
                     try {
                       const json = JSON.parse(rawValue);
                       const matchId = json.id || json.pointId || json.pt;
                       if (matchId === scanningPointId) {
                         const ptName = qrPointsList.find(p => p.id === matchId)?.name || 'Punto QR';
                         crearEvento(user.empresaId, {
                           tipo: 'qr_scan',
                           puntoNombre: ptName,
                           usuario: { 
                             nombre: fullUserData?.nombre || user?.nombre || 'Guardia',
                             apellido: fullUserData?.apellido || user?.apellido || '',
                             legajo: fullUserData?.legajo || ''
                           },
                           hora: new Date().toLocaleTimeString()
                         });
                       }
                     } catch(err) {}

                       try {
                         const json = JSON.parse(rawValue);
                         const matchId = json.id || json.pointId || json.pt; // Compatibilidad con QRs viejos y nuevos
                         
                         if (matchId === scanningPointId) {
                           // Exitoso: Ocultamos el scanner cerramos el modal puntual (setScanningPointId detiene el renderizado del Scanner)
                           if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Fuerte vibración de éxito
                           setScannedPoints(prev => [...prev, matchId]);
                           setScanningPointId(null);
                           // Mostramos un toast/feedback de éxito
                           const toast = document.createElement('div');
                           toast.innerText = '✅ PUNTO ESCANEADO CORRECTAMENTE';
                           toast.style = 'position:fixed;top:50px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:15px 30px;border-radius:30px;font-weight:900;z-index:9999;box-shadow:0 10px 25px rgba(16,185,129,0.5);animation: fadeOut 3s forwards;';
                           document.body.appendChild(toast);
                           setTimeout(() => toast.remove(), 3000);
                         } else {
                           // Incorrecto: Mostramos error temporal sobre la cámara sin usar alert()
                           const err = document.getElementById('qr-error-toast');
                           if(err) err.remove();
                           const toast = document.createElement('div');
                           toast.id = 'qr-error-toast';
                           toast.innerText = '❌ CÓDIGO INCORRECTO';
                           toast.style = 'position:absolute;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(239,68,68,0.9);color:white;padding:10px 20px;border-radius:20px;font-weight:bold;z-index:999;';
                           document.querySelector('.modal-content')?.appendChild(toast);
                           setTimeout(() => toast?.remove(), 2500);
                         }
                       } catch (e) {
                         // Fallo silencioso si encuentra cualquier otro código no-JSON o algo raro
                         console.warn('Scanned data in loop: Not valid JSON format or ignoring.', rawValue);
                       }
                     }}
                     onClose={() => setScanningPointId(null)}
                  />
                  <style>{`@keyframes fadeOut { 0%{opacity:0; top:30px;} 10%{opacity:1; top:50px;} 80%{opacity:1; top:50px;} 100%{opacity:0; top:30px;} }`}</style>
                </div>
             )}
          </div>
        </div>
      )}

    </div>
  );
};

const HighImpactButton = ({ icon, label, color, onClick }) => (
  <button 
    onClick={onClick} 
    className="btn-active-tactile"
    style={{
      ...styles.impactBtn, 
      background: `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.6) 100%)`,
      borderBottom: `6px solid ${color}88`,
      borderTop: '1px solid rgba(255,255,255,0.3)',
      boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
    }}
  >
    <div style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{icon}</div>
    <span style={{ marginTop: '5px' }}>{label}</span>
  </button>
);

const ActivityItem = ({ time, text, active }) => (
  <div style={styles.logItem}>
    <div style={{...styles.logDot, backgroundColor: active ? '#10b981' : '#3b82f6'}} />
    <div style={{flex: 1}}>
      <div style={{fontSize: '0.8rem', color: 'white'}}>{text}</div>
      <div style={{fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)'}}>{time}</div>
    </div>
  </div>
);

const styles = {
  container: { height: '100vh', width: '100vw', background: '#020617', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  phoneFrame: {
    width: '100%', maxWidth: '430px', height: '100vh', 
    background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
    padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative'
  },
  header: { textAlign: 'center', marginBottom: '15px' },
  logo: { fontSize: '1.4rem', fontWeight: 900, letterSpacing: '4px', color: 'white', margin: 0 },
  geofenceTag: { fontSize: '0.65rem', fontWeight: 'bold', marginTop: '5px', display: 'block' },
  
  // Nuevo Mapa
  mapContainer: { marginBottom: '20px' },
  mapViewport: { 
    width: '100%', height: '180px', borderRadius: '24px', position: 'relative', 
    overflow: 'hidden', background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
  },
  hudOverlay: { position: 'absolute', top: '15px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', zIndex: 10, alignItems: 'center' },
  hudBadge: { background: 'rgba(0, 0, 0, 0.85)', color: '#00d2ff', padding: '5px 10px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px', border: '1px solid rgba(0, 210, 255, 0.3)', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' },
  hudCords: { color: '#ffffff', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' },
  hudObjective: { position: 'absolute', bottom: '15px', left: '15px', zIndex: 10, background: 'rgba(0, 0, 0, 0.85)', border: '1px solid rgba(0, 210, 255, 0.4)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.65rem', color: '#00d2ff', fontWeight: 'bold', letterSpacing: '1px', backdropFilter: 'blur(5px)', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' },
  mapGraphic: { position: 'absolute', inset: 0, opacity: 0.8 },
  mapExpandBtn: { 
    position: 'absolute', bottom: '15px', right: '15px', width: '40px', height: '40px', 
    borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 
  },

  section: { marginBottom: '15px' },
  mainButton: { 
    width: '100%', padding: '18px', borderRadius: '18px', border: 'none', color: 'white', 
    fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', transition: 'all 0.1s',
    borderBottom: '6px solid rgba(0,0,0,0.4)',
    borderTop: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 12px 25px rgba(0,0,0,0.5)',
    letterSpacing: '1px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
  },
  panicButton: {
    width: '100%', height: '140px', backgroundColor: '#ef4444', color: 'white', border: 'none',
    borderRadius: '30px', fontSize: '1.4rem', fontWeight: '900', display: 'flex', 
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.1s',
    borderBottom: '10px solid #b91c1c',
    borderTop: '2px solid rgba(255,255,255,0.4)',
    boxShadow: '0 15px 35px rgba(239, 68, 68, 0.4)',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
  },
  opsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' },
  impactBtn: {
    height: '110px', border: 'none', borderRadius: '22px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold',
    fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.1s'
  },
  statusBanner: {
    background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '12px', 
    borderRadius: '15px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '20px', fontWeight: 'bold', border: '1px solid rgba(245, 158, 11, 0.3)',
    boxShadow: 'inset 0 0 15px rgba(245, 158, 11, 0.05)'
  },
  logSection: { flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '24px', padding: '18px', border: '1px solid rgba(255,255,255,0.05)' },
  logList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  logItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' },
  logDot: { width: '8px', height: '8px', borderRadius: '50%' },
  footer: { marginTop: '20px', textAlign: 'center', paddingBottom: '30px' },
  logoutBtn: { 
    background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)', 
    border: '1px solid rgba(239, 68, 68, 0.3)', 
    color: '#ef4444', padding: '14px 20px', borderRadius: '16px', fontSize: '0.8rem', 
    fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', gap: '8px', width: '100%', transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
    borderBottom: '3px solid rgba(239, 68, 68, 0.3)'
  },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(10px)' },
  reportModal: { width: '100%', maxWidth: '430px', background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)', padding: '25px', borderRadius: '35px 35px 0 0', borderTop: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', color: 'white' },
  multimediaGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '15px' },
  mediaBtn: { 
    padding: '18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '18px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '0.85rem',
    borderBottom: '4px solid rgba(0,0,0,0.3)', boxShadow: '0 6px 12px rgba(0,0,0,0.2)', transition: 'all 0.1s',
    cursor: 'pointer'
  },
  textArea: { 
    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px', color: 'white', padding: '18px', marginBottom: '25px', fontSize: '1rem', outline: 'none',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
  },
  confirmBtn: { 
    width: '100%', padding: '20px', background: 'linear-gradient(135deg, #00d2ff 0%, #3b82f6 100%)', color: 'white', 
    border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer',
    borderBottom: '6px solid #1d4ed8', borderTop: '1px solid rgba(255,255,255,0.4)',
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)', letterSpacing: '1px'
  },
  closeBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  routeInfo: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px' },
  routePoint: { 
    display: 'flex', alignItems: 'center', gap: '15px', padding: '18px', 
    background: 'rgba(255,255,255,0.03)', borderRadius: '20px', color: 'white',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  qrBtn: { 
    marginLeft: 'auto', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', border: 'none', 
    padding: '10px 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer',
    borderBottom: '3px solid rgba(0,0,0,0.3)', fontWeight: 'bold'
  }
};

export default StaffApp;
