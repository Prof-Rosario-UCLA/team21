import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

function CameraCapture({ onCapture, onClose }) {
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Try specific facing mode first, then fallback to any available camera
      let constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      let mediaStream;
      
      try {
        // Try with specific facing mode
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.log(`Failed to get ${facingMode} camera, trying any available camera...`);
        
        // Fallback to any available camera
        constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        };
        
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (fallbackErr) {
          // If still failing, try the most basic constraints
          constraints = { video: true, audio: false };
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      }

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video metadata to load before playing
        await new Promise((resolve, reject) => {
          const video = videoRef.current;
          
          const handleLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            resolve();
          };
          
          const handleError = (err) => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            reject(err);
          };
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('error', handleError);
          
          // Fallback timeout
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            resolve(); // Continue even if metadata doesn't load
          }, 3000);
        });

        // Now safely play the video
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.log('Video play failed, but stream is available:', playErr);
          // Don't throw here - the camera stream is still usable
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera is not supported in this browser.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints are too restrictive. Trying basic access...';
        // Try again with basic constraints
        setTimeout(() => {
          setFacingMode('user'); // Reset to default
          startCamera();
        }, 1000);
        return;
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // If using front camera, flip the captured image to match the preview
    if (facingMode === 'user') {
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onCapture(reader.result);
          handleClose();
        };
        reader.readAsDataURL(blob);
      }
      setCapturing(false);
    }, 'image/jpeg', 0.8);
  };

  const switchCamera = async () => {
    // Check available cameras before switching
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (cameras.length < 2) {
        console.log('Only one camera available, cannot switch');
        return; // Don't switch if only one camera
      }
      
      setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
    } catch (err) {
      console.log('Could not enumerate devices, trying to switch anyway:', err);
      setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const modalContent = (
    <div 
      className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-75 flex items-center justify-center"
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        inset: 0
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-md mx-4 my-4 overflow-hidden relative">
        <header className="bg-blue-600 text-white px-6 py-4">
          <h2 className="text-lg font-semibold">Take Profile Picture</h2>
        </header>

        <main className="p-4 md:p-6">
          {error ? (
            <section className="text-center py-8" role="alert">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </section>
          ) : (
            <section className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 md:h-64 object-cover"
                  style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera overlay circle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 md:w-48 md:h-48 border-4 border-white border-opacity-50 rounded-full"></div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                {/* Switch Camera Button */}
                <button
                  onClick={switchCamera}
                  disabled={capturing}
                  className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                  aria-label="Switch camera"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>

                {/* Capture Button */}
                <button
                  onClick={capturePhoto}
                  disabled={capturing || !stream}
                  className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Take photo"
                >
                  {capturing ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Position your face in the circle and click the camera button
              </p>
            </section>
          )}
        </main>

        <footer className="bg-gray-50 px-4 md:px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );

  // Use portal to render at document root level
  return createPortal(modalContent, document.body);
}

export default CameraCapture; 