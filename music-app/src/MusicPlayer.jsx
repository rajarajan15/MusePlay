import { Album, GitHub, Info as InfoIcon, LinkedIn, MusicNote, Pause, PlayArrow, SkipNext, SkipPrevious, Twitter, VolumeMute, VolumeUp } from "@mui/icons-material";
import { AppBar, Avatar, Box, Container, IconButton, Link, Paper, Slider, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

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

  // Info button handler - placeholder for future implementation
  const handleInfoClick = () => {
    // Empty implementation - will be added later
    console.log("Info button clicked");
  };

  return (
    <Box sx={{ 
      width: "100vw", 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column",
      background: "#121212", // Dark theme background
      position: "fixed",
      top: 0,
      left: 0,
      overflowY: "auto" // Allow scrolling to see description and footer
    }}>
      {/* Enhanced AppBar with application name and info button */}
      <AppBar 
        position="static" 
        sx={{ 
          background: "linear-gradient(90deg, #1a1a1a 0%, #2d1b69 100%)",
          boxShadow: "0 3px 15px rgba(0, 0, 0, 0.4)"
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <MusicNote 
              sx={{ 
                mr: 1.5, 
                minHeight: 80,
                color: "#bb86fc", 
                fontSize: 28,
                filter: "drop-shadow(0 2px 4px rgba(187, 134, 252, 0.3))"
              }} 
            />
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                letterSpacing: "0.5px",
                background: "linear-gradient(90deg, #e0e0e0 0%, #bb86fc 100%)",
                backgroundClip: "text",
                textFillColor: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 10px rgba(187, 134, 252, 0.2)"
              }}
            >
              MusePlay
            </Typography>
            {songs.length > 0 && isPlaying && (
              <Typography 
                variant="body2" 
                sx={{ 
                  ml: 2, 
                  color: "#aaa", 
                  fontStyle: "italic",
                  display: { xs: "none", sm: "block" }
                }}
              >
                Now Playing: {songs[songIndex]?.name}
              </Typography>
            )}
          </Box>
          
          <Tooltip title="React-based music player." arrow>
            <IconButton 
              color="inherit" 
              onClick={handleInfoClick}
              sx={{ 
                bgcolor: "rgba(255, 255, 255, 0.08)",
                '&:hover': { 
                  bgcolor: "rgba(255, 255, 255, 0.15)" 
                },
                transition: "all 0.2s"
              }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        pb: 8 // Add padding for footer
      }}>
        {/* Music Player Container */}
        <Container maxWidth="sm" sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          py: 4
        }}>
          <Paper 
            elevation={10}
            sx={{
              width: "100%",
              maxWidth: 400,
              borderRadius: 4,
              bgcolor: "#1e1e1e", // Dark theme paper background
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
              color: "#e0e0e0" // Light text for dark theme
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
                      bgcolor: "#2a2a2a", // Darker background for album cover
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
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
                        color: "#bb86fc", // Changed to match toolbar accent
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
                      <Typography variant="caption" sx={{ color: "#aaa" }}>
                        {formatTime(currentTime)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#aaa" }}>
                        {formatTime(duration)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Controls */}
                  <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 3 }}>
                    <IconButton onClick={handlePreviousSong} sx={{ color: "#e0e0e0" }}>
                      <SkipPrevious sx={{ fontSize: 32 }} />
                    </IconButton>

                    <IconButton 
                      onClick={togglePlayPause} 
                      sx={{ 
                        bgcolor: "#bb86fc", // Changed to match toolbar accent
                        color: "#121212", 
                        '&:hover': { bgcolor: "#9d6cd5" }, 
                        p: 1.8,
                        transition: "all 0.3s",
                        boxShadow: "0 4px 10px rgba(187, 134, 252, 0.3)"
                      }}
                    >
                      {isPlaying ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
                    </IconButton>

                    <IconButton onClick={handleNextSong} sx={{ color: "#e0e0e0" }}>
                      <SkipNext sx={{ fontSize: 32 }} />
                    </IconButton>
                  </Stack>

                  {/* Volume Control */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton onClick={toggleMute} size="small" sx={{ color: "#bbb" }}>
                      {isMuted || volume === 0 ? <VolumeMute fontSize="small" /> : <VolumeUp fontSize="small" />}
                    </IconButton>
                    <Slider 
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      aria-labelledby="volume-slider"
                      size="small"
                      sx={{ 
                        color: "#bb86fc", // Changed to match toolbar accent
                        opacity: 0.8
                      }}
                    />
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <Typography variant="h6" fontWeight="500" sx={{ color: "#aaa" }}>
                  Loading songs...
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>

        {/* App Description Section */}
        <Container maxWidth="md" sx={{ mt: 3, mb: 6 }}>
          <Paper
            elevation={6}
            sx={{
              p: 4,
              bgcolor: "#1e1e1e",
              borderRadius: 3,
              color: "#e0e0e0",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
            }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                mb: 3, 
                color: "#bb86fc",
                fontWeight: 600,
                borderBottom: "1px solid rgba(187, 134, 252, 0.3)",
                pb: 1
              }}
            >
              About MusePlay
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
            MusePlay includes a smooth volume fade-in feature to enhance the listening experience. When a song is paused while the volume is set above 50, the player automatically lowers it to 50. This prevents any sudden drop in sound and ensures a more natural transition when pausing music.
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }}>
            Once playback resumes, MusePlay gradually restores the previous volume level after a short delay if it was initially higher than 50. This keeps the audio experience seamless, maintaining user preferences without abrupt changes for a more immersive and enjoyable listening session.
            </Typography>

            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              Music is being streamed from a github repository named music-files. Find the repository from the github profile provided below.
              </Typography>
            {/* Creator Information */}
            <Box sx={{ mt: 5, mb: 2 }}>
              <Typography 
                variant="h6" 
                component="h3" 
                sx={{ 
                  mb: 2, 
                  color: "#bb86fc",
                  fontWeight: 600 
                }}
              >
                Creator
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    bgcolor: "#4a00e0",
                    mr: 2,
                    border: "2px solid #bb86fc"
                  }}
                >
                  RP
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Raja Rajan
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
                    Full Stack Developer
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton href="https://github.com/rajarajan15" size="small" sx={{ color: "#bb86fc" }}>
                      <GitHub fontSize="small" />
                    </IconButton>
                    <IconButton href="https://www.linkedin.com/in/rajarajan-a-p/" size="small" sx={{ color: "#bb86fc" }}>
                      <LinkedIn fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          width: "100%", 
          bgcolor: "#1a1a1a", 
          py: 3,
          mt: "auto",
          borderTop: "1px solid #333",
          // position: "fixed",
          bottom: 0,
          zIndex: 10
        }}
      >
        <Container>
          <Box sx={{ 
            display: "flex", 
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "center", sm: "flex-start" },
            textAlign: { xs: "center", sm: "left" }
          }}>
            <Box sx={{ mb: { xs: 2, sm: 0 } }}>
              <Typography variant="body2" sx={{ color: "#aaa" }}>
                © 2025 MusePlay.
              </Typography>
              <Typography variant="caption" sx={{ color: "#777", display: "block", mt: 0.5 }}>
                Built with React
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <Link href="mailto:rajarajanpanneerselvam15@gmail.com" underline="hover" sx={{ color: "#aaa", ":hover": { color: "#bb86fc" } }}>
                <Typography variant="body2">Contact</Typography>
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MusicPlayer;