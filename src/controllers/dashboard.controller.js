const User = require('../models/user.model');
const Hostel = require('../models/hostel.model');
const Chat = require('../models/chat.model');
const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const getDashboardData = asyncHandler(async (req, res) => {
  const user = req.user; // User object from the middleware

  // Check user type and fetch appropriate dashboard data
  if (user.userType === 'owner') {
    // Fetch data for owner dashboard
    // 1. Get hostels owned by the user
    const hostels = await Hostel.find({ ownerId: user._id }).select('name');

    // 2. Get messages related to the owner
    const chats = await Chat.find({
      roomId: { $regex: `_${user._id}$` }, // Match rooms where owner is the receiver (userId_ownerId)
    })
      .populate('senderId', 'firstName lastName') // Populate sender (tenant) details
      .lean();

    // 3. Format the messages data for the dashboard
    const messages = chats.map((chat) => {
      const sender = chat.senderId;
      const hostel = hostels.find((h) => chat.roomId.includes(h._id.toString()));
      return {
        hostelName: hostel ? hostel.name : 'Unknown Hostel',
        ownerName: `${sender.firstName} ${sender.lastName}`,
        action: 'View Chat', // This would link to the chat in the frontend
      };
    });

    // 4. Format the listed hostels for the right side of the dashboard
    const listedHostels = hostels.map((hostel) => hostel.name);

    return res.status(200).json({
      success: true,
      data: {
        userType: 'owner',
        messages,
        listedHostels,
      },
    });
  } else if (user.userType === 'tenant') {
    // Fetch data for tenant dashboard
    // 1. Get chats initiated by the tenant
    const chats = await Chat.find({
      roomId: { $regex: `^${user._id}_` }, // Match rooms where tenant is the sender (tenantId_ownerId)
    })
      .populate('receiverId', 'firstName lastName') // Populate receiver (owner) details
      .lean();

    // 2. Get hostels associated with the chats
    const hostelIds = chats.map((chat) => chat.roomId.split('_')[1]); // Extract ownerId from roomId
    const hostels = await Hostel.find({
      ownerId: { $in: hostelIds },
    }).select('name');

    // 3. Format the messages data for the tenant dashboard
    const messages = chats.map((chat) => {
      const receiver = chat.receiverId;
      const hostel = hostels.find((h) => chat.roomId.includes(h.ownerId.toString()));
      return {
        hostelName: hostel ? hostel.name : 'Unknown Hostel',
        ownerName: `${receiver.firstName} ${receiver.lastName}`,
        action: 'View Chat', // This would link to the chat in the frontend
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        userType: 'tenant',
        messages,
      },
    });
  } else {
    throw new ApiError(400, 'Invalid user type');
  }
});

module.exports = {
  getDashboardData,
};