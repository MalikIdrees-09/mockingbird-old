import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  useTheme,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Download,
  Share,
} from '@mui/icons-material';

const AudioWaveform = ({ 
  audioSrc, 
  audioSize = 0,
  audioDuration = 0,
  showControls = true,
  showWaveform = true,
  height = 60,
  color = null 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(Number.isFinite(audioDuration) && !Number.isNaN(audioDuration) ? audioDuration : 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const theme = useTheme();

  const waveformColor = color || theme.palette.primary.main;
  const backgroundColor = theme.palette.mode === 'dark' 
    ? 'rgba(255,255,255,0.1)' 
    : 'rgba(0,0,0,0.1)';

  // Initialize audio and generate waveform
  useEffect(() => {
    if (!audioSrc) return;

    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      const metaDuration = Number.isFinite(audio.duration) && !Number.isNaN(audio.duration)
        ? audio.duration
        : audioDuration;
      setDuration(metaDuration || 0);
      if (showWaveform) {
        generateWaveform();
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioSrc, showWaveform]);

  // Generate waveform data using Web Audio API
  const generateWaveform = async () => {
    if (!audioSrc) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(audioSrc);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 150; // Increased for better resolution
      const blockSize = Math.floor(channelData.length / samples);
      const waveform = [];

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        let max = 0;
        for (let j = 0; j < blockSize; j++) {
          const value = Math.abs(channelData[i * blockSize + j]);
          sum += value;
          max = Math.max(max, value);
        }
        // Use a combination of average and max for better visualization
        const avg = sum / blockSize;
        waveform.push((avg + max) / 2);
      }

      // Normalize waveform data
      const maxAmplitude = Math.max(...waveform);
      const normalizedWaveform = waveform.map(v => v / maxAmplitude);
      
      setWaveformData(normalizedWaveform);
    } catch (err) {
      console.error('Error generating waveform:', err);
      setError('Failed to generate waveform');
      // Generate a simple fallback waveform
      setWaveformData(Array(100).fill(0).map(() => Math.random() * 0.5 + 0.1));
    } finally {
      setIsLoading(false);
    }
  };

  // Draw waveform on canvas with enhanced visualization
  useEffect(() => {
    if (!showWaveform || !waveformData.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const barWidth = width / waveformData.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, width, height);

    waveformData.forEach((amplitude, index) => {
      const barHeight = amplitude * height * 0.9;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      
      const isPlayed = index / waveformData.length < progress;
      
      // Enhanced styling with gradients and rounded bars
      if (isPlayed) {
        // Create gradient for played portion
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, waveformColor);
        gradient.addColorStop(1, waveformColor + '99'); // Add transparency
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = backgroundColor;
      }
      
      // Draw rounded rectangles
      const radius = Math.min(barWidth * 0.4, 2);
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth * 0.85, barHeight, radius);
      ctx.fill();
      
      // Add glow effect for currently playing bar
      if (isPlaying && Math.abs((index / waveformData.length) - progress) < 0.02) {
        ctx.shadowColor = waveformColor;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }, [waveformData, currentTime, duration, waveformColor, backgroundColor, showWaveform, isPlaying]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (event, newValue) => {
    if (!audioRef.current) return;
    
    const newTime = (newValue / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (event, newValue) => {
    const newVolume = newValue / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(1);
      if (audioRef.current) {
        audioRef.current.volume = 1;
      }
      setIsMuted(false);
    } else {
      setVolume(0);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
      setIsMuted(true);
    }
  };

  const sanitizeTime = (value) => (Number.isFinite(value) && !Number.isNaN(value) ? value : 0);

  const formatTime = (time) => {
    const safeTime = sanitizeTime(time);
    const minutes = Math.floor(safeTime / 60);
    const seconds = Math.floor(safeTime % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const downloadAudio = () => {
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = 'audio.mp3';
    link.click();
  };

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 2, 
      backgroundColor: theme.palette.background.paper,
      borderRadius: 2,
      border: `1px solid ${theme.palette.divider}`,
      maxWidth: '100%'
    }}>
      {/* Audio info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <VolumeUp sx={{ color: waveformColor }} />
        <Typography variant="body2" color="text.secondary">
          Audio
        </Typography>
        {audioSize > 0 && (
          <Chip 
            label={formatFileSize(audioSize)} 
            size="small" 
            variant="outlined"
          />
        )}
        {duration > 0 && (
          <Chip 
            label={formatTime(duration)} 
            size="small" 
            variant="outlined"
          />
        )}
      </Box>

      {/* Waveform */}
      {showWaveform && (
        <Box sx={{ mb: 2, position: 'relative' }}>
          {isLoading && (
            <LinearProgress sx={{ mb: 1 }} />
          )}
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: `${height}px`,
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onClick={(e) => {
              if (!duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = clickX / rect.width;
              const newTime = percentage * duration;
              if (audioRef.current) {
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
              }
            }}
          />
        </Box>
      )}

      {/* Controls */}
      {showControls && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Play/Pause button */}
          <IconButton 
            onClick={togglePlayPause}
            sx={{ 
              backgroundColor: waveformColor,
              color: 'white',
              '&:hover': {
                backgroundColor: waveformColor,
                opacity: 0.8,
              }
            }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>

          {/* Time display */}
          <Typography variant="body2" sx={{ minWidth: '80px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>

          {/* Progress slider */}
          <Slider
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            sx={{
              flex: 1,
              color: waveformColor,
              '& .MuiSlider-thumb': {
                backgroundColor: waveformColor,
              },
              '& .MuiSlider-track': {
                backgroundColor: waveformColor,
              },
            }}
          />

          {/* Volume controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '120px' }}>
            <IconButton size="small" onClick={toggleMute}>
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
            <Slider
              value={volume * 100}
              onChange={handleVolumeChange}
              size="small"
              sx={{
                color: waveformColor,
                '& .MuiSlider-thumb': {
                  backgroundColor: waveformColor,
                },
                '& .MuiSlider-track': {
                  backgroundColor: waveformColor,
                },
              }}
            />
          </Box>

          {/* Download button */}
          <IconButton size="small" onClick={downloadAudio}>
            <Download />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default AudioWaveform;

