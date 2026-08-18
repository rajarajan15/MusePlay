import { Album, DarkMode, GitHub, Info as InfoIcon, LightMode, LinkedIn, MusicNote, Pause, PlayArrow, QueueMusic, SkipNext, SkipPrevious, UploadFile, VolumeMute, VolumeUp } from "@mui/icons-material";
import { Alert, AppBar, Avatar, Box, Button, Container, IconButton, Link, List, ListItemAvatar, ListItemButton, ListItemText, Pagination, Paper, Slider, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

const REPO_API_URL = "https://api.github.com/repos/rajarajan15/music-files/contents/";
const SONGS_PER_PAGE = 6;

const themes = {
  light: {
    pageBg: "#f5f1e6",
    pageAccent: "#d8cfba",
    pageGlow: "rgba(179, 85, 47, 0.18)",
    paper: "#fbf8f0",
    paperAlt: "#ece5d3",
    paperStripe: "#e4dcc6",
    ink: "#211f1a",
    muted: "#786f61",
    primary: "#4a5d3a",
    primaryDark: "#3d4d30",
    accent: "#b3552f",
    shadow: "#211f1a"
  },
  dark: {
    pageBg: "#111315",
    pageAccent: "#2d3328",
    pageGlow: "rgba(183, 124, 77, 0.2)",
    paper: "#1d211c",
    paperAlt: "#293026",
    paperStripe: "#232820",
    ink: "#f4ead7",
    muted: "#b7aa93",
    primary: "#9ab475",
    primaryDark: "#7f985d",
    accent: "#d28a54",
    shadow: "#050607"
  }
};

const MusicPlayer = () => {
  const audioRef = useRef(null);
  const localObjectUrlsRef = useRef([]);
  const fadeRestoreVolumeRef = useRef(70);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [songIndex, setSongIndex] = useState(0);
  const [songs, setSongs] = useState([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [songsError, setSongsError] = useState("");
  const [playlistPage, setPlaylistPage] = useState(1);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  // Song duration and progress
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const currentSong = songs[songIndex];
  const theme = isDarkTheme ? themes.dark : themes.light;
  const playlistPageCount = Math.max(1, Math.ceil(songs.length / SONGS_PER_PAGE));
  const visibleSongs = songs.slice((playlistPage - 1) * SONGS_PER_PAGE, playlistPage * SONGS_PER_PAGE);

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
        setSongsError("");
      })
      .catch(error => {
        console.error("Error fetching songs:", error);
        setSongsError("Unable to load songs from the GitHub music repository.");
      })
      .finally(() => setIsLoadingSongs(false));
  }, []);

  useEffect(() => {
    const objectUrls = localObjectUrlsRef.current;

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (audio.src !== currentSong.url) {
      audio.src = currentSong.url;
    }

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    if (playlistPage > playlistPageCount) {
      setPlaylistPage(playlistPageCount);
    }
  }, [playlistPage, playlistPageCount]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }

    fadeRestoreVolumeRef.current = volume;
  }, [volume, isMuted]);

  // Volume adjustment only when resuming playback
  useEffect(() => {
    let lowerVolumeTimeout, restoreVolumeTimeout;

    if (isPlaying && fadeRestoreVolumeRef.current > 60) {
      const originalVolume = fadeRestoreVolumeRef.current;

      lowerVolumeTimeout = setTimeout(() => {
        setVolume(50); // Reduce volume after 3 seconds
      }, 0);

      restoreVolumeTimeout = setTimeout(() => {
        setVolume(originalVolume); // Restore previous volume after 5 more seconds
      }, 3000);
    }

    return () => {
      clearTimeout(lowerVolumeTimeout);
      clearTimeout(restoreVolumeTimeout);
    };
  }, [isPlaying]); // Runs only when playback starts

  const togglePlayPause = () => {
    if (!audioRef.current || songs.length === 0) return;

    if (!isPlaying) {
      setIsPlaying(true);
      audioRef.current.play();
    } else {
      setIsPlaying(false);
      audioRef.current.pause();
    }
  };

  const handleNextSong = () => {
    if (songs.length === 0) return;

    setSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
    setIsPlaying(true);
  };

  const handlePreviousSong = () => {
    if (songs.length === 0) return;

    setSongIndex((prevIndex) => (prevIndex - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  const handleSongSelect = (index) => {
    setSongIndex(index);
    setIsPlaying(true);
  };

  const handlePlaylistPageChange = (event, value) => {
    setPlaylistPage(value);
  };

  const handleLocalSongUpload = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const mp3Files = selectedFiles.filter(
      (file) => file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3")
    );

    if (mp3Files.length === 0) {
      event.target.value = "";
      return;
    }

    const localSongs = mp3Files.map((file) => {
      const objectUrl = URL.createObjectURL(file);
      localObjectUrlsRef.current.push(objectUrl);

      return {
        name: file.name.replace(/\.mp3$/i, ""),
        url: objectUrl,
        coverUrl: null,
        isLocal: true
      };
    });

    setSongs((prevSongs) => {
      const nextSongs = [...prevSongs, ...localSongs];
      const firstUploadedSongIndex = prevSongs.length;
      setSongIndex(firstUploadedSongIndex);
      setPlaylistPage(Math.ceil(nextSongs.length / SONGS_PER_PAGE));
      setIsPlaying(true);
      return nextSongs;
    });

    event.target.value = "";
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
      backgroundColor: theme.pageBg,
      backgroundImage: `
        radial-gradient(circle at 18% 18%, ${theme.pageGlow} 0 130px, transparent 280px),
        radial-gradient(circle at 82% 12%, ${theme.pageGlow} 0 110px, transparent 260px),
        linear-gradient(135deg, transparent 0 47%, ${theme.pageAccent} 47% 48%, transparent 48% 100%),
        radial-gradient(${theme.pageAccent} 0.8px, transparent 0.8px)
      `,
      backgroundSize: "auto, auto, 42px 42px, 8px 8px",
      position: "fixed",
      top: 0,
      left: 0,
      color: theme.ink,
      transition: "background-color 0.25s ease, color 0.25s ease",
      overflowY: "auto" // Allow scrolling to see description and footer
    }}>
      {/* Enhanced AppBar with application name and info button */}
      <AppBar 
        position="static" 
        sx={{ 
          background: theme.paper,
          color: theme.ink,
          borderBottom: `1.5px solid ${theme.ink}`,
          boxShadow: `0 4px 0 ${theme.shadow}`,
          transition: "background-color 0.25s ease, color 0.25s ease"
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <MusicNote 
              sx={{ 
                mr: 1.5, 
                minHeight: 80,
                color: theme.primary, 
                fontSize: 28,
                filter: "none"
              }} 
            />
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              MusePlay
            </Typography>
            {songs.length > 0 && isPlaying && (
              <Typography 
                variant="body2" 
                sx={{ 
                  ml: 2, 
                  color: theme.muted, 
                  fontStyle: "normal",
                  letterSpacing: "0.04em",
                  display: { xs: "none", sm: "block" }
                }}
              >
                Now Playing: {songs[songIndex]?.name}
              </Typography>
            )}
          </Box>
          
          <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"} arrow>
            <IconButton 
              color="inherit" 
              onClick={() => setIsDarkTheme((current) => !current)}
              sx={{ 
                bgcolor: theme.paperAlt,
                border: `1.5px solid ${theme.ink}`,
                borderRadius: "4px",
                boxShadow: `2px 2px 0 ${theme.shadow}`,
                '&:hover': { 
                  bgcolor: theme.paperStripe,
                  transform: "translate(1px, 1px)",
                  boxShadow: `1px 1px 0 ${theme.shadow}`
                },
                transition: "all 0.2s"
              }}
            >
              {isDarkTheme ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          <Tooltip title="React-based music player." arrow>
            <IconButton 
              color="inherit" 
              onClick={handleInfoClick}
              sx={{ 
                bgcolor: theme.paperAlt,
                border: `1.5px solid ${theme.ink}`,
                borderRadius: "4px",
                boxShadow: `2px 2px 0 ${theme.shadow}`,
                '&:hover': { 
                  bgcolor: theme.paperStripe,
                  transform: "translate(1px, 1px)",
                  boxShadow: `1px 1px 0 ${theme.shadow}`
                },
                transition: "all 0.2s"
              }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
          </Stack>
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
          py: { xs: 3, sm: 5 }
        }}>
          <Paper 
            elevation={10}
            sx={{
              width: "100%",
              maxWidth: 400,
              border: `1.5px solid ${theme.ink}`,
              borderRadius: 2,
              bgcolor: theme.paper,
              overflow: "hidden",
              boxShadow: `6px 6px 0 ${theme.shadow}`,
              color: theme.ink,
              transition: "background-color 0.25s ease, color 0.25s ease"
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
                    background: `repeating-linear-gradient(135deg, ${theme.paperAlt} 0 8px, ${theme.paperStripe} 8px 14px)`,
                    color: theme.ink,
                    borderBottom: `1.5px solid ${theme.ink}`,
                    '&::before': { content: '"SIDE A / PAPER DECK"', position: "absolute", top: 12, left: 14, px: 0.75, py: 0.25, border: `1.5px solid ${theme.ink}`, bgcolor: theme.paper, fontSize: 10, letterSpacing: "0.08em" }
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 180,
                      height: 180,
                      mb: 3,
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: theme.paper,
                      border: `1.5px solid ${theme.ink}`,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      boxShadow: `4px 4px 0 ${theme.shadow}`,
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
                      <Album sx={{ fontSize: 80, color: theme.primary }} className="fallback-icon" />
                    )}
                    <Album 
                      sx={{ fontSize: 80, color: theme.primary, display: "none" }} 
                      className="fallback-icon" 
                    />
                  </Box>
                  
                  <Typography variant="h5" fontWeight="700" sx={{ mb: 0.5, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                    {currentSong?.name}
                  </Typography>
                  {currentSong?.isLocal && (
                    <Typography variant="caption" sx={{ color: theme.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Imported MP3
                    </Typography>
                  )}
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
                        color: theme.primary,
                        height: 8,
                        '& .MuiSlider-rail': { opacity: 1, bgcolor: theme.paperStripe, border: `1.5px solid ${theme.ink}` },
                        '& .MuiSlider-track': { border: `1.5px solid ${theme.ink}` },
                        mb: 1,
                        "& .MuiSlider-thumb": {
                          width: 0,
                          height: 0,
                          transition: "0.3s all",
                          "&:hover, &.Mui-active": {
                            width: 0,
                            height: 0,
                          }
                        }
                      }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: theme.muted }}>
                        {formatTime(currentTime)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.muted }}>
                        {formatTime(duration)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Controls */}
                  <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 3 }}>
                    <IconButton onClick={handlePreviousSong} sx={{ color: theme.ink, borderRadius: 1, '&:hover': { bgcolor: theme.paperStripe, outline: `1.5px solid ${theme.ink}` } }}>
                      <SkipPrevious sx={{ fontSize: 32 }} />
                    </IconButton>

                    <IconButton 
                      onClick={togglePlayPause} 
                      sx={{ 
                        bgcolor: theme.primary,
                        color: theme.paper, 
                        border: `1.5px solid ${theme.ink}`,
                        borderRadius: 1,
                        '&:hover': { bgcolor: theme.primaryDark, transform: "translate(2px, 2px)", boxShadow: `1px 1px 0 ${theme.shadow}` }, 
                        p: 1.8,
                        transition: "all 0.3s",
                        boxShadow: `3px 3px 0 ${theme.shadow}`
                      }}
                    >
                      {isPlaying ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
                    </IconButton>

                    <IconButton onClick={handleNextSong} sx={{ color: theme.ink, borderRadius: 1, '&:hover': { bgcolor: theme.paperStripe, outline: `1.5px solid ${theme.ink}` } }}>
                      <SkipNext sx={{ fontSize: 32 }} />
                    </IconButton>
                  </Stack>

                  {/* Volume Control */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton onClick={toggleMute} size="small" sx={{ color: theme.ink, borderRadius: 1, '&:hover': { bgcolor: theme.paperStripe, outline: `1.5px solid ${theme.ink}` } }}>
                      {isMuted || volume === 0 ? <VolumeMute fontSize="small" /> : <VolumeUp fontSize="small" />}
                    </IconButton>
                    <Slider 
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      aria-labelledby="volume-slider"
                      size="small"
                      sx={{ 
                        color: theme.accent,
                        opacity: 1,
                        '& .MuiSlider-rail': { opacity: 1, bgcolor: theme.paperStripe, border: `1.5px solid ${theme.ink}` },
                        '& .MuiSlider-track': { border: `1.5px solid ${theme.ink}` },
                        '& .MuiSlider-thumb': { width: 0, height: 0 }
                      }}
                    />
                  </Box>

                  {/* Song List */}
                  <Box sx={{ mt: 3, pt: 3, borderTop: `1.5px solid ${theme.ink}` }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ color: theme.primary, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Songs ({songs.length})
                      </Typography>
                      <Button
                        component="label"
                        startIcon={<UploadFile />}
                        variant="outlined"
                        size="small"
                        sx={{
                          color: theme.ink,
                          borderColor: theme.ink,
                          borderRadius: 1,
                          justifyContent: "center",
                          boxShadow: `2px 2px 0 ${theme.shadow}`,
                          '&:hover': {
                            borderColor: theme.ink,
                            bgcolor: theme.paperStripe,
                            boxShadow: `1px 1px 0 ${theme.shadow}`,
                            transform: "translate(1px, 1px)"
                          }
                        }}
                      >
                        Import MP3
                        <input type="file" accept=".mp3,audio/mpeg" multiple hidden onChange={handleLocalSongUpload} />
                      </Button>
                    </Stack>

                    <List dense disablePadding sx={{ border: `1.5px solid ${theme.ink}`, bgcolor: theme.paper }}>
                      {visibleSongs.map((song, index) => {
                        const absoluteIndex = (playlistPage - 1) * SONGS_PER_PAGE + index;
                        const selected = absoluteIndex === songIndex;

                        return (
                          <ListItemButton
                            key={`${song.url}-${absoluteIndex}`}
                            selected={selected}
                            onClick={() => handleSongSelect(absoluteIndex)}
                            sx={{
                              borderBottom: index === visibleSongs.length - 1 ? "none" : `1.5px solid ${theme.ink}`,
                              bgcolor: selected ? theme.paperStripe : "transparent",
                              '&.Mui-selected': { bgcolor: theme.paperStripe },
                              '&.Mui-selected:hover, &:hover': { bgcolor: theme.paperAlt }
                            }}
                          >
                            <ListItemAvatar sx={{ minWidth: 40 }}>
                              <QueueMusic sx={{ color: selected ? theme.accent : theme.primary }} />
                            </ListItemAvatar>
                            <ListItemText
                              primary={song.name}
                              secondary={song.isLocal ? "Imported" : "GitHub repo"}
                              primaryTypographyProps={{
                                noWrap: true,
                                sx: { color: theme.ink, fontWeight: selected ? 700 : 500 }
                              }}
                              secondaryTypographyProps={{
                                sx: { color: theme.muted, letterSpacing: "0.04em" }
                              }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>

                    {playlistPageCount > 1 && (
                      <Stack alignItems="center" sx={{ mt: 2 }}>
                        <Pagination
                          count={playlistPageCount}
                          page={playlistPage}
                          onChange={handlePlaylistPageChange}
                          size="small"
                          sx={{
                            '& .MuiPaginationItem-root': {
                              color: theme.ink,
                              borderRadius: 1
                            },
                            '& .Mui-selected': {
                              bgcolor: `${theme.primary} !important`,
                              color: theme.paper
                            }
                          }}
                        />
                      </Stack>
                    )}
                  </Box>
                </Box>
              </>
            ) : isLoadingSongs ? (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <Typography variant="h6" fontWeight="700" sx={{ color: theme.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Loading songs...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                {songsError && (
                  <Alert severity="error" sx={{ mb: 3, border: `1.5px solid ${theme.ink}`, borderRadius: 1 }}>
                    {songsError}
                  </Alert>
                )}
                <Button
                  component="label"
                  startIcon={<UploadFile />}
                  variant="outlined"
                  sx={{ color: theme.ink, borderColor: theme.ink, borderRadius: 1 }}
                >
                  Import MP3
                  <input type="file" accept=".mp3,audio/mpeg" multiple hidden onChange={handleLocalSongUpload} />
                </Button>
              </Box>
            )}
          </Paper>
        </Container>

        {/* App Description Section */}
        <Container maxWidth="md" sx={{ mt: 3, mb: 6 }}>
          <Paper
            elevation={6}
            sx={{
              p: { xs: 3, sm: 4 },
              bgcolor: theme.paper,
              border: `1.5px solid ${theme.ink}`,
              borderRadius: 2,
              color: theme.ink,
              boxShadow: `6px 6px 0 ${theme.shadow}`,
              transition: "background-color 0.25s ease, color 0.25s ease"
            }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                mb: 3, 
                color: theme.primary,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderBottom: `1.5px solid ${theme.ink}`,
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
                  color: theme.primary,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase"
                }}
              >
                Creator
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    bgcolor: theme.paperStripe,
                    mr: 2,
                    color: theme.ink,
                    border: `1.5px solid ${theme.ink}`,
                    borderRadius: 1,
                    boxShadow: `3px 3px 0 ${theme.shadow}`
                  }}
                >
                  RP
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Raja Rajan
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.muted, mb: 1 }}>
                    Full Stack Developer
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton href="https://github.com/rajarajan15" size="small" sx={{ color: theme.ink, borderRadius: 1, '&:hover': { bgcolor: theme.paperStripe, outline: `1.5px solid ${theme.ink}` } }}>
                      <GitHub fontSize="small" />
                    </IconButton>
                    <IconButton href="https://www.linkedin.com/in/rajarajan-a-p/" size="small" sx={{ color: theme.ink, borderRadius: 1, '&:hover': { bgcolor: theme.paperStripe, outline: `1.5px solid ${theme.ink}` } }}>
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
          bgcolor: theme.paper, 
          color: theme.ink,
          py: 3,
          mt: "auto",
          borderTop: `1.5px solid ${theme.ink}`,
          boxShadow: `0 -4px 0 ${theme.shadow}`,
          // position: "fixed",
          bottom: 0,
          zIndex: 10,
          transition: "background-color 0.25s ease, color 0.25s ease"
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
              <Typography variant="body2" sx={{ color: theme.ink, letterSpacing: "0.04em" }}>
                © 2025 MusePlay.
              </Typography>
              <Typography variant="caption" sx={{ color: theme.muted, display: "block", mt: 0.5 }}>
                Built with React
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <Link href="mailto:rajarajanpanneerselvam15@gmail.com" underline="hover" sx={{ color: theme.ink, ":hover": { color: theme.primary } }}>
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
