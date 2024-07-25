import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = "your-secret-key";
// Rota de cadastro
app.post("/register", async (req, res) => {
  const { email, password, name, age } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "Email já está em uso" });
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      age,
    },
  });

  res.status(201).json({ message: "Usuário cadastrado com sucesso", user });
});

// Rota de login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ message: "Credenciais inválidas" });
  }

  // Verifica a senha
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Credenciais inválidas" });
  }

  const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "1h" });

  res.status(200).json({ user, token });
});

// Rota para criar uma transação
app.post("/transacoes", async (req, res) => {
  const { amount, type, userId, categoria } = req.body;

  const transaction = await prisma.transaction.create({
    data: {
      amount,
      type,
      userId,
      categoria,
    },
  });

  res.status(201).json(transaction);
});

// Rota para deletar uma transação
app.delete("/transacoes/:id", async (req, res) => {
  const { id } = req.params;

  await prisma.transaction.delete({
    where: { id: id },
  });

  res.status(200).json({ message: "Transação deletada com sucesso!" });
});

app.get("/transacoes", async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    include: {
      user: true,
    },
  });

  res.status(200).json(transactions);
});

// Rota para visualizar usuários
app.get("/usuarios", async (req, res) => {
  let users;

  if (req.query) {
    users = await prisma.user.findMany({
      where: {
        name: req.query.name,
        email: req.query.email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        // age: false
      },
    });
  } else {
    users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        // age: false
      },
    });
  }

  res.status(200).json(users);
});

app.listen(3333, () => {
  console.log("Server is running on port 3333");
});
