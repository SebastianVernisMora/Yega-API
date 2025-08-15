import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pino from 'pino';
const log = pino({ transport: { target: 'pino-pretty' } });
const prisma = new PrismaClient();
const router = Router();
router.post('/register', async (req, res, next) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                http: 400,
                message: 'Missing required fields',
            },
        });
    }
    try {
        const normalizedEmail = email.toLowerCase();
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            log.warn(`Registration attempt for existing email: ${normalizedEmail}`);
            return res.status(400).json({
                error: {
                    code: 'EMAIL_TAKEN',
                    http: 400,
                    message: 'A user with this email already exists.',
                },
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                password: hashedPassword,
                role,
            },
        });
        const signOptions = {
            expiresIn: 604800, // 7 days in seconds
        };
        const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'super-secreto', signOptions);
        const userForResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
        res.status(201).json({
            token,
            user: userForResponse,
        });
    }
    catch (error) {
        log.error(error, 'Error during registration');
        next(error);
    }
});
router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                http: 400,
                message: 'Missing required fields',
            },
        });
    }
    try {
        const normalizedEmail = email.toLowerCase();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            log.warn(`Login attempt for non-existent email: ${normalizedEmail}`);
            return res.status(401).json({
                error: {
                    code: 'AUTH_INVALID',
                    http: 401,
                    message: 'Invalid credentials',
                },
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            log.warn(`Invalid password attempt for email: ${normalizedEmail}`);
            return res.status(401).json({
                error: {
                    code: 'AUTH_INVALID',
                    http: 401,
                    message: 'Invalid credentials',
                },
            });
        }
        const signOptions = {
            expiresIn: 604800, // 7 days in seconds
        };
        const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'super-secreto', signOptions);
        const userForResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
        res.status(200).json({
            token,
            user: userForResponse,
        });
    }
    catch (error) {
        log.error(error, 'Error during login');
        next(error);
    }
});
export default router;
