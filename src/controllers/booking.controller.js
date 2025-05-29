const Booking = require('../models/booking.model');
const { Hostel } = require('../models/hostel.model');
const Payment = require('../models/payment.model');
const User = require('../models/user.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sendMail = require('../utils/mailer');
const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const createBooking = asyncHandler(async (req, res) => {
  const { hostelId, firstName, lastName, email, phone, moveInDate, message } = req.body;

  if (!hostelId || !firstName || !lastName || !email || !phone || !moveInDate) {
    throw new ApiError(400, 'All required fields must be provided');
  }

  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    throw new ApiError(404, 'Hostel not found');
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
});

const processPayment = asyncHandler(async (req, res) => {
  const { bookingId, paymentMethodId } = req.body;

  if (!bookingId || !paymentMethodId) {
    throw new ApiError(400, 'Booking ID and payment method ID are required');
  }

  const booking = await Booking.findById(bookingId)
    .populate('hostelId')
    .populate('userId');
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.userId._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Unauthorized access to this booking');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: 25000 * 100, // Amount in paisa (PKR)
        currency: 'pkr',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
      },
      {
        idempotencyKey: bookingId.toString(), // Prevents double charges
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
      throw new ApiError(400, 'Payment failed');
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
    await new Payment({
      userId: req.user._id,
      hostelId: booking.hostelId._id,
      bookingId: booking._id,
      amount: 25000,
      paymentMethod: 'Stripe',
      status: 'failed',
      transactionId: err.payment_intent?.id || 'N/A',
    }).save();

    throw new ApiError(500, err.message || 'Payment processing failed');
  }
});

module.exports = {
  createBooking,
  processPayment,
};