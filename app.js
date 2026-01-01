require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser"); // добавьте
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");

const User = require("./models/User");
const Story = require("./models/Story");

const app = express();

app.use(cookieParser()); // добавьте
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Подключение к MongoDB
mongoose.connect("mongodb://localhost:27017/auth-server", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware для проверки JWT токена в заголовке
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = decoded; // { id, role }
    next();
  });
};

// Middleware для проверки админа
const checkAdminAuth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/admin");
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err || decoded.role !== "admin") return res.redirect("/admin");
    req.user = decoded;
    next();
  });
};

// Главная страница
app.get("/", (req, res) => {
  res.send("API is running. Use /stories to get stories.");
});

// Регистрация пользователя
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.json({ message: "User registered" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error registering user", error: err.message });
  }
});

// Вход пользователя
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  res.json({ token });
});

// Получение всех рассказов — публичный
app.get("/stories", async (req, res) => {
  const stories = await Story.find();
  res.json(stories);
});

// Страница входа админа
app.get("/admin", (req, res) => {
  res.render("login");
});

// Обработка входа админа
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_LOGIN &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/admin/dashboard");
  } else {
    res.render("login", { error: "Invalid credentials" });
  }
});

// Страница с админкой
app.get("/admin/dashboard", checkAdminAuth, (req, res) => {
  res.render("admin");
});

// CRUD маршруты для рассказов — только для админа
app.post("/stories", checkAdminAuth, async (req, res) => {
  const { title, genre, ageRating, coverResId, rawContent } = req.body;
  const story = new Story({ title, genre, ageRating, coverResId, rawContent });
  await story.save();
  res.json(story);
});

app.delete("/stories/:id", checkAdminAuth, async (req, res) => {
  await Story.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

app.put("/stories/:id", checkAdminAuth, async (req, res) => {
  const updated = await Story.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
