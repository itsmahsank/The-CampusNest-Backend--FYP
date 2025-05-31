const Booking = require('../models/booking.model');
const  Hostel  = require('../models/hostel.model');
const Payment = require('../models/payment.model');
const User = require('../models/user.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sendMail = require('../utils/mailer');

const createBooking = async (req, res) => {
  try {
    const { hostelId, firstName, lastName, email, phone, moveInDate, message } = req.body;

    if (!hostelId || !firstName || !lastName || !email || !phone || !moveInDate) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    const booking = new Booking({
      userId: req.user._id,
      hostelId,
      firstName,
      lastName,
      email,
      phone,
      moveInDate,
      message,
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking saved successfully',
      bookingId: booking._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

const processPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethodId } = req.body;

    if (!bookingId || !paymentMethodId) {
      return res.status(400).json({ success: false, message: 'Booking ID and payment method ID are required' });
    }

    const booking = await Booking.findById(bookingId).populate('hostelId').populate('userId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: 25000 * 100, // amount in paisa (PKR)
        currency: 'pkr',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: 'https://your-frontend-return-url.com', // add a valid return_url for redirect-based payments
      },
      {
        idempotencyKey: bookingId.toString(),
      }
    );

    if (
      paymentIntent.status === 'requires_action' &&
      paymentIntent.next_action?.type === 'redirect_to_url'
    ) {
      return res.status(200).json({
        success: false,
        requiresAction: true,
        paymentIntentId: paymentIntent.id,
        redirectUrl: paymentIntent.next_action.redirect_to_url.url,
      });
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment failed' });
    }

    const payment = new Payment({
      userId: req.user._id,
      hostelId: booking.hostelId._id,
      bookingId: booking._id,
      amount: 25000,
      paymentMethod: 'Stripe',
      status: 'success',
      transactionId: paymentIntent.id,
    });
    await payment.save();

    booking.isPaid = true;
    booking.paidAt = new Date();
    await booking.save();

    const hostelOwner = await User.findById(booking.hostelId.ownerId);

    await sendMail(
      booking.email,
      'Booking and Payment Confirmation - CampusNest',
      `Hi ${booking.firstName},\n\nYour booking for ${booking.hostelId.name} has been confirmed!\n\nDetails:\n- Hostel: ${booking.hostelId.name}\n- Move-in Date: ${booking.moveInDate.toDateString()}\n- Amount Paid: Rs. 25,000\n- Transaction ID: ${paymentIntent.id}\n\nThank you for choosing CampusNest!`
    );

    await sendMail(
      hostelOwner.email,
      'New Booking and Payment Received - CampusNest',
      `Hello ${hostelOwner.firstName},\n\nYou have a new booking for ${booking.hostelId.name}.\n\nGuest Details:\n- Name: ${booking.firstName} ${booking.lastName}\n- Email: ${booking.email}\n- Phone: ${booking.phone}\n- Move-in Date: ${booking.moveInDate.toDateString()}\n- Amount Paid: Rs. 25,000\n- Transaction ID: ${paymentIntent.id}\n\nPlease prepare for their arrival!`
    );

    res.status(200).json({
      success: true,
      message: 'Payment successful',
      paymentId: payment._id,
    });
  } catch (err) {
    // Save failed payment attempt
    try {
      await new Payment({
        userId: req.user._id,
        hostelId: req.body.hostelId,
        bookingId: req.body.bookingId,
        amount: 25000,
        paymentMethod: 'Stripe',
        status: 'failed',
        transactionId: err.payment_intent?.id || 'N/A',
      }).save();
    } catch (saveError) {
      console.error('Error saving failed payment:', saveError);
    }

    res.status(500).json({ success: false, message: err.message || 'Payment processing failed' });
  }
};

module.exports = {
  createBooking,
  processPayment,
};
