import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    description: 'Debe ser un string',
  },
  description: {
    type: String,
    required: true,
    trim: true,
    description: 'Debe ser un string',
  },
});

export default mongoose.model('Rol', roleSchema, 'Rol');