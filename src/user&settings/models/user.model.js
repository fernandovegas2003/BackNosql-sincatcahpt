import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  roleID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rol',
    required: true,
    description: 'Debe ser un ObjectId',
  },
  username: {
    type: String,
    required: true,
    trim: true,
    description: 'Debe ser un string',
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    description: 'Debe ser un string',
  },
  password: {
    type: String,
    required: true,
    description: 'Debe ser un string',
  },
  firstName: {
    type: String,
    required: true,
    description: 'Debe ser un string',
  },
  lastName: {
    type: String,
    required: true,
    description: 'Debe ser un string',
  },
  age: {
    type: Number,
    required: true,
    description: 'Debe ser un número',
  },
  country: {
    type: String,
    required: true,
    description: 'Debe ser un string',
  },
  state: {
    type: String,
    required: true,
    description: 'Debe ser un string',
  },
  city: {
    type: String,
    required: true,
    description: 'Debe ser un string',
  },
  birthDate: {
    type: Date,
    required: true,
    description: 'Debe ser una fecha',
  },
  cedula: {
    type: String,
    required: true,
    description: 'Debe ser un string',
  },
  registrationDate: {
    type: Date,
    required: true,
    default: Date.now,
    description: 'Debe ser una fecha',
  },
  status: {
    type: String,
    required: true,
    description: 'Debe ser un string',
  }
},{
  timestamps: true
});

export default mongoose.model('User', userSchema, 'User');
