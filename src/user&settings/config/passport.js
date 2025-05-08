import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';
import Rol from '../models/rol.model.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // pon esto en tu .env
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Busca usuario por email
      const email = profile.emails[0].value;
      let user = await User.findOne({ email });

      if (!user) {
        // Si no existe, crea uno nuevo con rol "Usuario"
        const role = await Rol.findOne({ name: 'Usuario' });
        user = new User({
          roleID: role._id,
          username: profile.displayName,
          email,
          password: '', // No hay password, solo Google
          firstName: profile.name.givenName || '',
          lastName: profile.name.familyName || '',
          age: 18, // Puedes pedirlo luego
          country: '',
          state: '',
          city: '',
          birthDate: new Date(),
          cedula: '',
          registrationDate: new Date(),
          status: 'active',
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Serialización (opcional, si usas sesiones)
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

export default passport;