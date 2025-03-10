
import { Pause, PlayArrow, SkipNext, SkipPrevious, VolumeMute, VolumeUp, Album } from "@mui/icons-material";
import { Box, Container, IconButton, Slider, Stack, Typography, Avatar, Paper } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const REPO_API_URL = "https://api.github.com/repos/rajarajan15/music-files/contents/";

const MusicPlayer = () => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [songIndex, setSongIndex] = useState(0);
  const [songs, setSongs] = useState([]);
  const [prevVolume, setPrevVolume] = useState(70); // Store previous volume before reduction
  
  // Song duration and progress
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    axios.get(REPO_API_URL)
      .then(response => {
        const mp3Files = response.data
          .filter(file => file.name.endsWith(".mp3"))
          .map(file => {
            const songName = decodeURIComponent(file.name.replace(".mp3", ""));
            return {
              name: songName,
              url: file.download_url.replace("/blob/", "/raw/"),
              // Look for a matching image file with the same name as the song
              coverUrl: response.data.find(
                imgFile => 
                  (imgFile.name === `${file.name.replace(".mp3", "")}.jpg` || 
                   imgFile.name === `${file.name.replace(".mp3", "")}.png` ||
                   imgFile.name === `${file.name.replace(".mp3", "")}.jpeg`)
              )?.download_url || null
            };
          });
        setSongs(mp3Files);
      })
      .catch(error => console.error("Error fetching songs:", error));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (songs.length > 0) {
      audio.src = songs[songIndex]?.url;
      if (isPlaying) audio.play();
    }
  }, [songIndex, songs]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Volume adjustment only when resuming playback
  useEffect(() => {
    let lowerVolumeTimeout, restoreVolumeTimeout;

    if (isPlaying && volume > 60) {
      lowerVolumeTimeout = setTimeout(() => {
        setPrevVolume(volume); // Save current volume before reducing
        setVolume(50); // Reduce volume after 3 seconds
      }, 0);

      restoreVolumeTimeout = setTimeout(() => {
        setVolume(prevVolume); // Restore previous volume after 5 more seconds
      }, 3000);
    }

    return () => {
      clearTimeout(lowerVolumeTimeout);
      clearTimeout(restoreVolumeTimeout);
    };
  }, [isPlaying]); // Runs only when playback starts

  const togglePlayPause = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      audioRef.current.play();
    } else {
      setIsPlaying(false);
      audioRef.current.pause();
    }
  };

  const handleNextSong = () => {
    setSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
    setIsPlaying(true);
  };

  const handlePreviousSong = () => {
    setSongIndex((prevIndex) => (prevIndex - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    setIsMuted(newValue === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Time updates from the audio element
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Metadata loaded to get duration
  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setCurrentTime(0);
    }
  };

  // Progress bar changes
  const handleProgressChange = (event, newValue) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newValue;
      setCurrentTime(newValue);
    }
  };

  // Format time in MM:SS
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "00:00";
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ 
      width: "100vw", 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "linear-gradient(145deg, #f0f0f0, #f8f9fa)",
      position: "fixed",
      top: 0,
      left: 0
    }}>
      <Container maxWidth="sm" sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center"
      }}>
        <Paper 
          elevation={10}
          sx={{
            width: "100%",
            maxWidth: 400,
            borderRadius: 4,
            bgcolor: "#ffffff",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)",
          }}
        >
          <audio 
            ref={audioRef} 
            autoPlay={isPlaying} 
            onEnded={handleNextSong}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleMetadataLoaded}
          />

          {songs.length > 0 ? (
            <>
              {/* Cover Image Section */}
              <Box 
                sx={{ 
                  p: 4,
                  pt: 5,
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center",
                  textAlign: "center", 
                  position: "relative",
                  overflow: "hidden",
                  background: "linear-gradient(to bottom, #8e2de2, #4a00e0)",
                  color: "white"
                }}
              >
                <Box 
                  sx={{ 
                    width: 180,
                    height: 180,
                    mb: 3,
                    borderRadius: "50%",
                    overflow: "hidden",
                    bgcolor: "#e0e0e0",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
                    animation: isPlaying ? "spin 20s linear infinite" : "none",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" }
                    }
                  }}
                >
                  {songs[songIndex]?.coverUrl ? (
                    <img 
                      src={songs[songIndex].coverUrl} 
                      alt="Album Cover" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.currentTarget.parentNode.querySelector(".fallback-icon").style.display = "block";
                      }}
                    />
                  ) : (
                    <Album sx={{ fontSize: 80, color: "#9e9e9e" }} className="fallback-icon" />
                  )}
                  <Album 
                    sx={{ fontSize: 80, color: "#9e9e9e", display: "none" }} 
                    className="fallback-icon" 
                  />
                </Box>
                
                <Typography variant="h5" fontWeight="600" sx={{ mb: 0.5 }}>
                  {songs[songIndex]?.name}
                </Typography>
              </Box>

              {/* Player Controls */}
              <Box sx={{ p: 3 }}>
                {/* Progress Bar */}
                <Box sx={{ mb: 3 }}>
                  <Slider
                    value={currentTime}
                    min={0}
                    max={duration || 100}
                    onChange={handleProgressChange}
                    aria-labelledby="progress-slider"
                    size="small"
                    sx={{ 
                      color: "#4a00e0", 
                      mb: 1,
                      "& .MuiSlider-thumb": {
                        width: 12,
                        height: 12,
                        transition: "0.3s all",
                        "&:hover, &.Mui-active": {
                          width: 14,
                          height: 14,
                        }
                      }
                    }}
                  />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      {formatTime(currentTime)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      {formatTime(duration)}
                    </Typography>
                  </Box>
                </Box>

                {/* Controls */}
                <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 3 }}>
                  <IconButton onClick={handlePreviousSong} sx={{ color: "#444" }}>
                    <SkipPrevious sx={{ fontSize: 32 }} />
                  </IconButton>

                  <IconButton 
                    onClick={togglePlayPause} 
                    sx={{ 
                      bgcolor: "#4a00e0", 
                      color: "white", 
                      '&:hover': { bgcolor: "#3c00b8" }, 
                      p: 1.8,
                      transition: "all 0.3s",
                      boxShadow: "0 4px 10px rgba(74, 0, 224, 0.3)"
                    }}
                  >
                    {isPlaying ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
                  </IconButton>

                  <IconButton onClick={handleNextSong} sx={{ color: "#444" }}>
                    <SkipNext sx={{ fontSize: 32 }} />
                  </IconButton>
                </Stack>

                {/* Volume Control */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <IconButton onClick={toggleMute} size="small" sx={{ color: "#555" }}>
                    {isMuted || volume === 0 ? <VolumeMute fontSize="small" /> : <VolumeUp fontSize="small" />}
                  </IconButton>
                  <Slider 
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    aria-labelledby="volume-slider"
                    size="small"
                    sx={{ 
                      color: "#4a00e0",
                      opacity: 0.8
                    }}
                  />
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <Typography variant="h6" fontWeight="500" sx={{ color: "#666" }}>
                Loading songs...
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default MusicPlayer;