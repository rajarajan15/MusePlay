import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";

const Header = () => {
  return (
    <AppBar position="static" sx={{ bgcolor: "#6c5ce7", boxShadow: "none" }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, color: "black", fontWeight: 500 }}>
          🎵 Music Player
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;