import app from "./app.js";

const PORT = Number.parseInt(process.env.PORT || "3000");
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (http://localhost:${PORT})`);
});
