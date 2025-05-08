import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

export const updateUsername = async (req, res) => {
    try {
      const { username } = req.body;
  
      if (!username) {
        return res.status(400).json({ message: 'El nombre de usuario es requerido' });
      }
  
      const user = await User.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      user.username = username;
      await user.save();
  
      res.json({ message: 'Nombre de usuario actualizado correctamente' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
  
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'La contraseña actual y la nueva contraseña son requeridas' });
      }
  
      const user = await User.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      // Verificar la contraseña actual
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
      }
  
      // Validar que la nueva contraseña no contenga el nombre o apellido
      const lowerNewPassword = newPassword.toLowerCase();
      if (
        lowerNewPassword.includes(user.firstName.toLowerCase()) ||
        lowerNewPassword.includes(user.lastName.toLowerCase())
      ) {
        return res.status(400).json({ message: 'La nueva contraseña no puede contener tu nombre o apellido' });
      }
  
      // Actualizar la contraseña
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
  
      res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};