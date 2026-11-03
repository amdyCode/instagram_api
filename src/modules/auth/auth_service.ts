import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma.js';
import { signToken } from '../../lib/jwt.js';

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

export async function register(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();

  // Validations simples et claires
  if (!email.includes('@')) {
    throw new GraphQLError('Format d’adresse email invalide', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (username.length < 3 || username.length > 30) {
    throw new GraphQLError('Le nom d’utilisateur doit contenir entre 3 et 30 caractères', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (input.password.length < 6) {
    throw new GraphQLError('Le mot de passe doit comporter au moins 6 caractères', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  // Vérifier si l'email ou le username existe déjà
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new GraphQLError('Cet email est déjà utilisé', {
        extensions: { code: 'CONFLICT' },
      });
    }
    throw new GraphQLError('Ce nom d’utilisateur est déjà pris', {
      extensions: { code: 'CONFLICT' },
    });
  }

  // Hachage simple avec bcrypt
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      fullName: input.fullName?.trim() || null,
      avatarUrl: input.avatarUrl?.trim() || null,
    },
  });

  const token = signToken({ userId: user.id });

  return { token, user };
}

export async function login(input: LoginInput) {
  const identifier = input.emailOrUsername.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    throw new GraphQLError('Identifiants invalides', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new GraphQLError('Identifiants invalides', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const token = signToken({ userId: user.id });

  return { token, user };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new GraphQLError('Utilisateur introuvable', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  return user;
}
