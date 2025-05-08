import Rol from '../models/rol.model.js';

class InitialSetup {
  static async createRoles() {
    const roles = [
      { name: 'Administrador', description: 'Rol con todos los permisos' },
      { name: 'Usuario', description: 'Rol con permisos limitados' },
    ];

    for (const role of roles) {
      const existingRole = await Rol.findOne({ name: role.name });
      if (!existingRole) {
        await new Rol(role).save();
        console.log(`Rol ${role.name} creado`);
      }
    }
  }
}

export default InitialSetup;