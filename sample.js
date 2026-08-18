
import express from "express";
import fetch from "node-fetch";
import { spawn } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
app.use(express.json());

app.use(bodyParser.json());