import React, { useState } from 'react';
import {
  Box,
  IconButton,
  useTheme,
  MobileStepper,
} from '@mui/material';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';
import AudioWaveform from './AudioWaveform';

const MediaCarousel = ({ mediaFiles, mediaTypes }) => {
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const maxSteps = mediaFiles.length;

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  if (!mediaFiles || mediaFiles.length === 0) return null;

  const renderMedia = (mediaFile, mediaType) => {
    if (mediaType === 'image' || mediaFile.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return (
        <img
          src={`${process.env.REACT_APP_API_URL}/assets/${mediaFile}`}
          alt="Post media"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '500px',
            objectFit: 'contain',
            display: 'block',
            borderRadius: '8px',
          }}
        />
      );
    } else if (mediaType === 'audio' || mediaFile.match(/\.(mp3|wav|ogg|aac|flac)$/i)) {
      return (
        <Box sx={{ width: '100%', p: 2 }}>
          <AudioWaveform
            audioSrc={`${process.env.REACT_APP_API_URL}/assets/${mediaFile}`}
            showControls={true}
            showWaveform={true}
            height={80}
          />
        </Box>
      );
    } else if (mediaType === 'video' || mediaFile.match(/\.(mp4|webm|mov)$/i)) {
      return (
        <video
          controls
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '500px',
            objectFit: 'contain',
            display: 'block',
            borderRadius: '8px',
          }}
          src={`${process.env.REACT_APP_API_URL}/assets/${mediaFile}`}
        />
      );
    }
    return null;
  };

  if (maxSteps === 1) {
    // Single media - no carousel needed
    return (
      <Box sx={{ width: '100%', position: 'relative' }}>
        {renderMedia(mediaFiles[0], mediaTypes?.[0])}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Media Display */}
      <Box sx={{ width: '100%', position: 'relative' }}>
        {renderMedia(mediaFiles[activeStep], mediaTypes?.[activeStep])}

        {/* Navigation Arrows */}
        {activeStep > 0 && (
          <IconButton
            onClick={handleBack}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <KeyboardArrowLeft />
          </IconButton>
        )}

        {activeStep < maxSteps - 1 && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <KeyboardArrowRight />
          </IconButton>
        )}
      </Box>

      {/* Stepper Dots */}
      <MobileStepper
        steps={maxSteps}
        position="static"
        activeStep={activeStep}
        sx={{
          backgroundColor: 'transparent',
          justifyContent: 'center',
          '& .MuiMobileStepper-dot': {
            backgroundColor: theme.palette.grey[400],
          },
          '& .MuiMobileStepper-dotActive': {
            backgroundColor: theme.palette.primary.main,
          },
        }}
        nextButton={<Box />}
        backButton={<Box />}
      />
    </Box>
  );
};

export default MediaCarousel;
