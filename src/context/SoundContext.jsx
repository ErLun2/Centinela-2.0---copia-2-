import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth, ROLES } from './AuthContext';

const SoundContext = createContext();

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};

export const SoundProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    enabled: true,
    generalVolume: 0.5,
    panicVolume: 0.8,
  });
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [isMissedRoundActive, setIsMissedRoundActive] = useState(false);
  const [dynamicAnnouncement, setDynamicAnnouncement] = useState('');
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Audio Instances
  const normalAudio = useRef(null);
  const qrAudio = useRef(null);
  const panicAudio = useRef(null);

  // Initialize audio objects
  useEffect(() => {
    normalAudio.current = new Audio('/sounds/normal.mp3');
    qrAudio.current = new Audio('/sounds/qr.mp3');
    panicAudio.current = new Audio('/sounds/panico.mp3');
    // REMOVED manual .loop = true to allow alternating
    panicAudio.current.loop = false;

    // Load settings from localStorage safely
    if (user?.uid) {
      try {
        const savedSettings = localStorage.getItem(`centinela_sound_settings_${user.uid}`);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (e) {
        console.warn("Sound settings restore failed:", e);
      }
    }
  }, [user?.uid]);

  // Update volumes
  useEffect(() => {
    if (normalAudio.current) normalAudio.current.volume = settings.generalVolume;
    if (qrAudio.current) qrAudio.current.volume = settings.generalVolume;
    if (panicAudio.current) panicAudio.current.volume = settings.panicVolume;
  }, [settings.generalVolume, settings.panicVolume]);

  const saveSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (user?.uid) {
      localStorage.setItem(`centinela_sound_settings_${user.uid}`, JSON.stringify(updated));
    }
  };

  const stopAllSounds = () => {
    [normalAudio, qrAudio, panicAudio].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    setIsPanicActive(false);
    setIsMissedRoundActive(false);
    setDynamicAnnouncement('');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const stopPanic = () => {
    if (panicAudio.current) {
      panicAudio.current.pause();
      panicAudio.current.currentTime = 0;
    }
    setIsPanicActive(false);
    if (!isMissedRoundActive) setDynamicAnnouncement('');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const stopMissedRound = () => {
    setIsMissedRoundActive(false);
    if (!isPanicActive) setDynamicAnnouncement('');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const playSynthFallback = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq, start, duration, vol, typeOsc = 'sine', sweep = false) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = typeOsc;
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        if (sweep) {
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + start + duration);
        }
        
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(vol * 0.2, ctx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
        
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      if (type === 'normal') {
        playTone(440, 0, 0.5, settings.generalVolume);
        playTone(660, 0.6, 0.8, settings.generalVolume);
      } else if (type === 'qr') {
        for (let i = 0; i < 5; i++) {
          playTone(800 + (i * 100), i * 0.3, 0.2, settings.generalVolume, 'sine', true);
        }
      } else if (type === 'missed_round') {
        for (let i = 0; i < 3; i++) {
          playTone(500, i * 0.4, 0.2, settings.panicVolume, 'triangle');
        }
      } else if (type === 'panico') {
        const duration = 5.0;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(ctx.destination);
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.5, ctx.currentTime); 
        lfoGain.gain.setValueAtTime(200, ctx.currentTime); 
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(settings.panicVolume * 0.3, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(settings.panicVolume * 0.3, ctx.currentTime + duration - 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        lfo.start();
        osc.start();
        lfo.stop(ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);
      }
    } catch (e) {
      console.error("Synth fallback failed", e);
    }
  };

  // Guardamos la última locución en una ref para evitar recolección de basura (GC)
  const lastUtteranceRef = useRef(null);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    
    // Cancelar cualquier discurso previo para dar paso al nuevo
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    // Referenciar para evitar que el recolector de basura lo elimine antes de sonar
    lastUtteranceRef.current = utterance;
    
    window.speechSynthesis.speak(utterance);
    return utterance;
  };

  const playSound = async (type, dynamicText = '') => {
    if (!settings.enabled && type !== 'panico' && type !== 'missed_round') return;

    if (type === 'panico') {
      stopAllSounds();
      setIsPanicActive(true);
      if (dynamicText) setDynamicAnnouncement(dynamicText);
      // No disparamos audio aquí, el useEffect se encargará de la secuencia
      return;
    }

    if (type === 'missed_round') {
      stopAllSounds();
      setIsMissedRoundActive(true);
      if (dynamicText) setDynamicAnnouncement(dynamicText);
      return;
    }

    if (isPanicActive || isMissedRoundActive) return;

    let audioToPlay = null;
    if (type === 'normal') audioToPlay = normalAudio.current;
    if (type === 'qr') audioToPlay = qrAudio.current;

    if (audioToPlay) {
      if (dynamicText) {
        speak(dynamicText);
        // Pequeño retardo para que la voz no compita con el inicio del sonido
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      if (!audioToPlay.paused && audioToPlay.currentTime > 0 && audioToPlay.currentTime < 0.2) return; 
      try {
        audioToPlay.currentTime = 0;
        await audioToPlay.play();
        setAutoplayBlocked(false);
      } catch (error) {
        if (error.name === 'NotAllowedError') setAutoplayBlocked(true);
        else playSynthFallback(type);
      }
    }
  };

  const testSound = (type) => {
    let audio = null;
    if (type === 'normal') audio = normalAudio.current;
    if (type === 'qr') audio = qrAudio.current;
    if (type === 'panico') audio = panicAudio.current;

    if (audio) {
      audio.currentTime = 0;
      audio.play().then(() => {
        setAutoplayBlocked(false);
      }).catch(e => {
        if (e.name === 'NotAllowedError') setAutoplayBlocked(true);
        else {
          playSynthFallback(type);
          setAutoplayBlocked(false);
        }
      });
    } else {
      playSynthFallback(type);
      setAutoplayBlocked(false);
    }
  };

  // Loop Secuenciado (Voz -> Alarma -> Voz -> Alarma)
  useEffect(() => {
    let timeoutId = null;
    let isStopped = false;

    const runSequence = async () => {
      if (isStopped) return;

      if (isPanicActive || isMissedRoundActive) {
        // 1. HABLAR (Voz)
        if (dynamicAnnouncement) speak(dynamicAnnouncement);
        else if (isMissedRoundActive) speak("Atención: Ronda no realizada");
        else speak("Alerta: Botón de pánico activado");

        // Esperar a que termine de hablar (~4 seg antes de la sirena)
        await new Promise(resolve => timeoutId = setTimeout(resolve, 3500));
        if (isStopped || (!isPanicActive && !isMissedRoundActive)) return;

        // 2. SONAR (Alarma)
        const type = isPanicActive ? 'panico' : 'missed_round';
        if (type === 'panico') {
          try {
            await panicAudio.current.play();
            setAutoplayBlocked(false);
          } catch (e) {
            playSynthFallback('panico');
          }
        } else {
          playSynthFallback('missed_round');
        }

        // Esperar a que pase la sirena (~6 seg antes de repetir voz)
        await new Promise(resolve => timeoutId = setTimeout(resolve, 6000));
        if (isStopped || (!isPanicActive && !isMissedRoundActive)) return;

        // 3. REPETIR
        runSequence();
      }
    };

    if (isPanicActive || isMissedRoundActive) {
      runSequence();
    }

    return () => {
      isStopped = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isPanicActive, isMissedRoundActive, dynamicAnnouncement]);

  const value = {
    settings,
    saveSettings,
    playSound,
    stopPanic,
    stopMissedRound,
    speak,
    isPanicActive,
    isMissedRoundActive,
    autoplayBlocked,
    setAutoplayBlocked,
    testSound
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
};
