const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// Hotel Configuration
const FLOORS = 10;
const ROOMS_PER_FLOOR = [10, 10, 10, 10, 10, 10, 10, 10, 10, 7]; // Floor 10 has only 7 rooms
const MAX_ROOMS_PER_BOOKING = 5;

// Init hotel state
let hotelState = initializeHotel();

function initializeHotel() {
  const state = {};
  for (let floor = 1; floor <= FLOORS; floor++) {
    state[floor] = {};
    const roomCount = ROOMS_PER_FLOOR[floor - 1];
    for (let room = 1; room <= roomCount; room++) {
      const roomNumber = floor * 100 + room;
      state[floor][roomNumber] = { booked: false, guestId: null };
    }
  }
  return state;
}

function getRoomNumber(floor, position) {
  if (floor === 10) {
    return 1000 + position;
  }
  return floor * 100 + position;
}

function getFloorAndPosition(roomNumber) {
  if (roomNumber >= 1001 && roomNumber <= 1007) {
    return { floor: 10, position: roomNumber - 1000 };
  }
  const floor = Math.floor(roomNumber / 100);
  const position = roomNumber % 100;
  return { floor, position };
}

function calculateTravelTime(room1, room2) {
  const r1 = getFloorAndPosition(room1);
  const r2 = getFloorAndPosition(room2);

  const horizontalDistance = Math.abs(r1.position - r2.position);
  const verticalDistance = Math.abs(r1.floor - r2.floor);

  const horizontalTime = horizontalDistance * 1; // 1 minute per room
  const verticalTime = verticalDistance * 2;     // 2 minutes per floor

  return horizontalTime + verticalTime;
}

function findAvailableRoomsOnFloor(floor, requiredRooms) {
  const roomCount = ROOMS_PER_FLOOR[floor - 1];
  const availableRooms = [];

  for (let position = 1; position <= roomCount; position++) {
    const roomNumber = getRoomNumber(floor, position);
    if (!hotelState[floor][roomNumber].booked) {
      availableRooms.push(roomNumber);
    }
  }

  // If we have exactly the required rooms on this floor or more
  if (availableRooms.length >= requiredRooms) {
    // Find consecutive or close rooms to minimize travel time
    let bestCombination = [];
    let bestTravelTime = Infinity;

    // try all combinations of availableRooms
    for (let i = 0; i <= availableRooms.length - requiredRooms; i++) {
      const combination = availableRooms.slice(i, i + requiredRooms);
      const travelTime = calculateTravelTime(combination[0], combination[combination.length - 1]);
      if (travelTime < bestTravelTime) {
        bestTravelTime = travelTime;
        bestCombination = combination;
      }
    }

    return { rooms: bestCombination, travelTime: bestTravelTime, floor };
  }

  return null;
}

function findOptimalBooking(requiredRooms) {
  // try single floor first
  for (let floor = 1; floor <= FLOORS; floor++) {
    const result = findAvailableRoomsOnFloor(floor, requiredRooms);
    if (result) {
      return result;
    }
  }

  // fallback: multiple floors, trying to minimize travel time
  let bestCombination = [];
  let bestTravelTime = Infinity;

  // Get all available rooms
  const allAvailableRooms = [];
  for (let floor = 1; floor <= FLOORS; floor++) {
    const roomCount = ROOMS_PER_FLOOR[floor - 1];
    for (let position = 1; position <= roomCount; position++) {
      const roomNumber = getRoomNumber(floor, position);
      if (!hotelState[floor][roomNumber].booked) {
        allAvailableRooms.push(roomNumber);
      }
    }
  }

  if (allAvailableRooms.length < requiredRooms) {
    return null; // Not enough rooms available
  }

  // Try combinations to find minimum travel time
  for (let i = 0; i <= allAvailableRooms.length - requiredRooms; i++) {
    const combination = allAvailableRooms.slice(i, i + requiredRooms);
    const travelTime = calculateTravelTime(combination[0], combination[combination.length - 1]);
    if (travelTime < bestTravelTime) {
      bestTravelTime = travelTime;
      bestCombination = combination;
    }
  }

  if (bestCombination.length === requiredRooms) {
    return { rooms: bestCombination, travelTime: bestTravelTime, multiFloor: true };
  }

  return null;
}

// API Routes

// Get all rooms status
app.get('/api/rooms', (req, res) => {
  const roomsData = [];
  for (let floor = 1; floor <= FLOORS; floor++) {
    const roomCount = ROOMS_PER_FLOOR[floor - 1];
    for (let position = 1; position <= roomCount; position++) {
      const roomNumber = getRoomNumber(floor, position);
      roomsData.push({
        roomNumber,
        floor,
        position,
        booked: hotelState[floor][roomNumber].booked,
        guestId: hotelState[floor][roomNumber].guestId
      });
    }
  }
  res.json(roomsData);
});

// Book rooms
app.post('/api/book', (req, res) => {
  const { requiredRooms, guestId } = req.body;

  if (!requiredRooms || requiredRooms < 1 || requiredRooms > MAX_ROOMS_PER_BOOKING) {
    return res.status(400).json({ 
      error: `Must book between 1 and ${MAX_ROOMS_PER_BOOKING} rooms` 
    });
  }

  const booking = findOptimalBooking(requiredRooms);

  if (!booking) {
    return res.status(400).json({ error: 'Not enough available rooms' });
  }

  // Book the rooms
  const actualGuestId = guestId || `guest_${Date.now()}`;
  for (const roomNumber of booking.rooms) {
    const { floor } = getFloorAndPosition(roomNumber);
    hotelState[floor][roomNumber].booked = true;
    hotelState[floor][roomNumber].guestId = actualGuestId;
  }

  res.json({
    success: true,
    guestId: actualGuestId,
    bookedRooms: booking.rooms,
    travelTime: booking.travelTime,
    message: `successfully booked ${booking.rooms.length} rooms (travel time: ${booking.travelTime} mins)`
  });
});

// rand occupancy
app.post('/api/random-occupancy', (req, res) => {
  hotelState = initializeHotel();
  
  // Randomly book 20-40% of rooms
  const randomPercentage = 0.2 + Math.random() * 0.2;
  const totalRooms = 97;
  const roomsToBook = Math.floor(totalRooms * randomPercentage);

  const allRooms = [];
  for (let floor = 1; floor <= FLOORS; floor++) {
    const roomCount = ROOMS_PER_FLOOR[floor - 1];
    for (let position = 1; position <= roomCount; position++) {
      allRooms.push(getRoomNumber(floor, position));
    }
  }

  // Shuffle and book random rooms
  for (let i = 0; i < roomsToBook; i++) {
    const randomIndex = Math.floor(Math.random() * allRooms.length);
    const roomNumber = allRooms[randomIndex];
    const { floor } = getFloorAndPosition(roomNumber);
    hotelState[floor][roomNumber].booked = true;
    hotelState[floor][roomNumber].guestId = `random_guest_${Math.floor(Math.random() * 1000)}`;
    allRooms.splice(randomIndex, 1);
  }

  res.json({ success: true, message: `randomly booked ${roomsToBook} rooms` });
});

// reset
app.post('/api/reset', (req, res) => {
  hotelState = initializeHotel();
  res.json({ success: true, message: 'bookings reset' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Hotel Reservation API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
