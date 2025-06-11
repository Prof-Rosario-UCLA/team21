import React, { useState, useRef, useEffect } from 'react';

function VoiceRecorder({ onRecordingComplete, isRecording, onToggleRecording }) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const streamRef = useRef(null);
  const recordedDurationRef = useRef(0);

  useEffect(() => {
    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      recordedDurationRef.current = 0;

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Calculate final duration before processing
        recordedDurationRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Set up audio level monitoring
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;

      const updateAudioLevel = () => {
        if (isRecording && startTimeRef.current) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(100, average));
          
          // Update duration
          const currentDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setDuration(currentDuration);
          
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      mediaRecorderRef.current.start();
      updateAudioLevel();

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevel(0);
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      setIsProcessing(true);
      
      // Ensure we have a valid duration
      const finalDuration = recordedDurationRef.current || duration || 1;
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        
        onRecordingComplete({
          audioData: base64data,
          duration: finalDuration,
          audioSize: audioBlob.size
        });
        
        setIsProcessing(false);
        setDuration(0);
        recordedDurationRef.current = 0;
      };
      
      reader.onerror = () => {
        console.error('Error reading audio file');
        setIsProcessing(false);
        setDuration(0);
        recordedDurationRef.current = 0;
      };
      
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
      setDuration(0);
      recordedDurationRef.current = 0;
    }
  };

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-orange-50/40 border border-orange-200 rounded-lg">
        <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-stone-700">
            Processing audio...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-orange-50/40 border border-orange-200 rounded-lg">
      <button
        onClick={onToggleRecording}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 scale-110' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isRecording ? (
          <div className="w-4 h-4 bg-white rounded-sm"></div>
        ) : (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zM19 11c0 .56-.05 1.11-.14 1.64-.22 1.53-.77 2.93-1.59 4.04-.27.36-.74.46-1.13.24-.39-.23-.51-.7-.29-1.08.65-.87 1.07-1.9 1.24-3.01.07-.46.11-.93.11-1.41V11c0-.55.45-1 1-1s1 .45 1 1zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1V11c0-.55-.45-1-1-1s-1 .45-1 1v.18c0 3.49 2.54 6.29 5.81 6.72V20h-3c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1h-3v-2.1c1.02-.13 1.99-.45 2.86-.9l1.67 1.67L21 18.73 4.27 3z"/>
          </svg>
        )}
      </button>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-stone-700">
            {isRecording ? 'Recording...' : 'Ready to record'}
          </span>
          <span className="text-sm text-stone-500">
            {formatDuration(duration)} / 1:00
          </span>
        </div>
        
        <div className="w-full bg-stone-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-100 ${
              isRecording ? 'bg-red-400' : 'bg-blue-400'
            }`}
            style={{ width: `${Math.min(100, (audioLevel / 100) * 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default VoiceRecorder; 