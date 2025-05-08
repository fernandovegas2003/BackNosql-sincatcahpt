import { z } from 'zod';

export const updateUsernameSchema = z.object({
    username: z.string()
        .nonempty({ message: 'El nombre de usuario es requerido' })
        .trim()
        .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' }),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string()
        .nonempty({ message: 'La contraseña actual es requerida' }),
    newPassword: z.string()
        .nonempty({ message: 'La nueva contraseña es requerida' })
        .min(10, { message: 'La nueva contraseña debe tener al menos 10 caracteres' })
        .regex(/[A-Z]/, { message: 'La nueva contraseña debe contener al menos una letra mayúscula' })
        .regex(/[0-9]/, { message: 'La nueva contraseña debe contener al menos un número' })
        .regex(/[^A-Za-z0-9]/, { message: 'La nueva contraseña debe contener al menos un símbolo' }),
});