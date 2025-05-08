import Stripe from 'stripe';
import User from '../models/user.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, userId } = req.body;

    // Usar los valores que vienen del frontend o valores predeterminados
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 250000,
      currency: currency || 'cop',
      payment_method_types: ['card'],
      metadata: { userId: userId || 'anonymous' },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: error.message });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  // Asegúrate de que req.body está disponible como string
  // Si estás usando express.raw(), req.body ya será un Buffer
  const payload = req.body;
  
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const userId = paymentIntent.metadata.userId;

    console.log(`✅ Payment succeeded for user: ${userId}`);

    try {
      // Busca y activa al usuario
      const user = await User.findById(userId);
      if (user) {
        user.status = "active";
        await user.save();
        console.log(`User ${userId} activated successfully`);
      } else {
        console.log(`User ${userId} not found`);
      }
    } catch (error) {
      console.error(`Error updating user status: ${error.message}`);
      // No devolvemos error a Stripe, para evitar reintentos
    }
  }

  // Devolver una respuesta para confirmar la recepción del evento
  res.json({ received: true });
};