const { ObjectId } = require("mongodb");
const { verifyJWTToken } = require("../middleware/auth");

function registerPaymentsRoutes(
  app,
  { ordersCollection, paymentHistoryCollection },
  stripe,
) {
  app.post("/create-payment-session", verifyJWTToken, async (req, res) => {
    const orderInfo = req.body;
    const amount = parseInt(orderInfo.price * 100);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "USD",
            unit_amount: amount,
            product_data: {
              name: `Please pay for ${orderInfo.mealName}`,
            },
          },
          quantity: orderInfo.quantity,
        },
      ],
      mode: "payment",
      metadata: {
        mealName: orderInfo.mealName,
        orderId: orderInfo._id,
      },
      customer_email: orderInfo.userEmail,
      success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_DOMAIN}/dashboard/my-orders`,
    });

    res.send({ url: session.url });
  });

  app.patch("/payment-success", verifyJWTToken, async (req, res) => {
    const sessionId = req.query.session_id;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const transactionId = session.payment_intent;

    const paymentExists = await paymentHistoryCollection.findOne({
      transactionId,
    });

    if (paymentExists) {
      return res.send({ message: "payment recorded" });
    }

    if (session.payment_status === "paid") {
      const orderId = session.metadata.orderId;

      await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { paymentStatus: "paid" } },
      );

      const paymentRecord = {
        userEmail: session.customer_email,
        orderId,
        mealName: session.metadata.mealName,
        transactionId,
        paymentTime: new Date(),
      };

      const result = await paymentHistoryCollection.insertOne(paymentRecord);

      res.send({
        success: true,
        modifyParcel: result,
        transactionId,
      });
    }
  });
}

module.exports = registerPaymentsRoutes;
