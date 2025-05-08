import paypal from '@paypal/checkout-server-sdk';
import User from '../models/user.model.js'; 

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

export const createPayPalOrder = async (req, res) => {
    const { userId } = req.body;
  
    // Fuerza el monto y la moneda
    const amount = "1.00";
    const currency = "USD";
  
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount,
        },
        custom_id: userId,
      }],
      application_context: {
        return_url: 'https://tuapp.com/paypal/success',
        cancel_url: 'https://tuapp.com/paypal/cancel',
      },
    });
  
    try {
      const order = await client.execute(request);
      res.json({ id: order.result.id, links: order.result.links });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
};

export const capturePayPalOrder = async (req, res) => {
  const { token } = req.query;

  const request = new paypal.orders.OrdersCaptureRequest(token);
  request.requestBody({});

  try {
    const capture = await client.execute(request);

    // Extraer el userId guardado en custom_id al crear la orden
    const userId = capture.result.purchase_units[0].custom_id;

    // Buscar el usuario y activar su cuenta
    const user = await User.findById(userId);
    if (user) {
      user.status = "active";
      await user.save();
    } else {
      return res.status(404).json({ message: "Usuario no encontrado para activar después del pago." });
    }

    res.json({ message: 'Pago exitoso, cuenta activada', capture });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};