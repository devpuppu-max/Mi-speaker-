const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let command = "NONE";

// Home page
app.get("/", (req, res) => {
  res.send("Mi Speaker server running");
});

// Phone/AIDE reads this
app.get("/command", (req, res) => {
  res.json({
    command: command
  });
});

// Test commands manually
app.get("/play", (req, res) => {
  command = "PLAY";
  res.send("PLAY");
});

app.get("/pause", (req, res) => {
  command = "PAUSE";
  res.send("PAUSE");
});

app.get("/volup", (req, res) => {
  command = "VOLUP";
  res.send("VOLUP");
});

app.get("/voldown", (req, res) => {
  command = "VOLDOWN";
  res.send("VOLDOWN");
});

app.get("/next", (req, res) => {
  command = "NEXT";
  res.send("NEXT");
});

app.get("/previous", (req, res) => {
  command = "PREVIOUS";
  res.send("PREVIOUS");
});

// Phone clears the command after using it
app.get("/clear", (req, res) => {
  command = "NONE";
  res.send("CLEARED");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
