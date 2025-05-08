import User from '../models/user.model.js';
import Rol from '../models/rol.model.js';
import bcrypt from 'bcryptjs';
import { createAccessToken } from '../libs/jwt.js';
import PasswordResetToken from '../models/passwordResetToken.model.js';
import sgMail from '@sendgrid/mail';
import axios from 'axios'; 
import { OAuth2Client } from 'google-auth-library';

// ✅ FIX: Definimos la constante desde las variables de entorno
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const register = async (req, res) => {
  try {
    const {
      roleName = 'Usuario',
      username,
      email,
      password,
      firstName,
      lastName,
      age,
      country,
      state,
      city,
      birthDate,
      cedula,
      status,
    } = req.body;

    // Validar que la contraseña no contenga el nombre ni el apellido
    const lowerPassword = password.toLowerCase();  
    if (  
      lowerPassword.includes(firstName.toLowerCase()) ||  
      lowerPassword.includes(lastName.toLowerCase())  
    ) {  
      return res.status(400).json({ message: "La contraseña no puede contener tu nombre o apellido" });  
    }

    // Buscar el roleID correspondiente al nombre del rol
    const role = await Rol.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ message: 'El rol especificado no existe' });
    }

    // Verificar si el rol es "Administrador"
    if (roleName === 'Administrador') {
      const existingAdmin = await User.findOne({ roleID: role._id });
      if (existingAdmin) {
        return res.status(403).json({ message: 'Ya existe un administrador registrado' });
      }
    }

    const passwordHash = await bcrypt.hash(password,10)

    // Crear un nuevo usuario con el roleID
    const newUser = new User({
      roleID: role._id,
      username,
      email,
      password: passwordHash,
      firstName,
      lastName,
      age,
      country,
      state,
      city,
      birthDate,
      cedula,
      registrationDate: new Date(),
      status: "active",
    });
    console.log(newUser);

    const userSaved = await newUser.save();
    const token = await createAccessToken({ id: userSaved._id});
    
    res.cookie("token", token);

    res.json({  
        id: userSaved._id,  
        username: userSaved.username,  
        email: userSaved.email, 
        created_at: userSaved.createdAt,
        updated_at: userSaved.updatedAt,  
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { emailOrUsername, password, rememberMe, captcha } = req.body;

    if (!captcha) {
      return res.status(400).json({ message: "Captcha requerido" });
    }

    const secret = "6LeIJzIrAAAAABiJNrjjD4j7_6MKHj_0e9W2JJZz"; 
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${captcha}`;
    const { data } = await axios.post(verifyUrl);

    if (!data.success) {
      return res.status(400).json({ message: "Captcha inválido" });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario o correo no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = await createAccessToken({ id: user._id });

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    };

    if (rememberMe) {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
    }

    res.cookie('token', token, cookieOptions);

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) return res.status(400).json({ message: "Token de Google requerido" });

    console.log("Token de Google recibido:", credential);

    // ✅ Usamos GOOGLE_CLIENT_ID que definimos arriba
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        username: payload.email.split("@")[0],
        email: payload.email,
        firstName: payload.given_name || "",
        lastName: payload.family_name || "",
        age: 18,
        country: "",
        state: "",
        city: "",
        birthDate: "",
        cedula: "",
        registrationDate: new Date(),
        status: "active",
      });
    }

    const token = await createAccessToken({ id: user._id });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    });
  } catch (error) {
    console.error("Error en Google login:", error);
    res.status(500).json({ message: "Error al autenticar con Google" });
  }
};

export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  return res.sendStatus(200);
};

export const profile = async (req, res) => {
  const userFound = await User.findById(req.user.id);

  if (!userFound) return res.status(404).json({ message: 'User not found' });

  return res.json(
    {
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      created_at: userFound.createdAt,
      updated_at: userFound.updatedAt,
    })
};

export const forgotPassword = async (req, res) => {  
  try {  
    const { email, cedula } = req.body;  
  
    const user = await User.findOne({ email, cedula });  
    if (!user) {  
      return res.status(404).json({ message: 'Usuario no encontrado' });  
    }  
  
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();  
    const resetTokenExpires = Date.now() + 5 * 60 * 1000;  
  
    await PasswordResetToken.create({  
      userId: user._id,  
      token: resetToken,  
      expiresAt: resetTokenExpires,  
    });  
  
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);  
  
    const msg = {  
      to: email,  
      from: process.env.SENDGRID_FROM,
      subject: 'Recuperación de contraseña',  
      text: `Tu código de recuperación es: ${resetToken}. Este código expira en 5 minutos.`,  
    };  
  
    await sgMail.send(msg);  
  
    res.json({ message: 'Correo de recuperación enviado' });  
  } catch (error) {  
    console.error('Error al enviar el correo:', error);  
    res.status(500).json({ message: error.message });  
  }  
};

export const verifyResetToken = async (req, res) => {
  try {
    const { email, resetToken } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const tokenRecord = await PasswordResetToken.findOne({
      userId: user._id,
      token: resetToken,
      expiresAt: { $gt: Date.now() },
    });

    if (!tokenRecord) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    res.json({ message: 'Token válido' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const tokenRecord = await PasswordResetToken.findOne({
      userId: user._id,
      token: resetToken,
      expiresAt: { $gt: Date.now() },
    });

    if (!tokenRecord) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    console.log('Nueva contraseña (plana):', newPassword);  
    const hashedPassword = await bcrypt.hash(newPassword, 10);  
    console.log('Hash guardado:', hashedPassword);  

    user.password = hashedPassword;
    await user.save();

    await PasswordResetToken.deleteOne({ _id: tokenRecord._id });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};