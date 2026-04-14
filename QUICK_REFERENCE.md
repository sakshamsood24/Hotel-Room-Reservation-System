# Quick Reference

Just some quick notes on how to test the app:

### api tests
if u want to test the api directly:

- `GET http://localhost:5001/api/rooms` - gets the grid state
- `POST http://localhost:5001/api/book` body `{ "requiredRooms": 3 }` - books 3 rooms
- `POST http://localhost:5001/api/random-occupancy` - randomizes
- `POST http://localhost:5001/api/reset` - flushes the rooms booked

### travel time check
u can verify the travel time in the UI when u book.
e.g. if u book 2 rooms on same floor next to each other, travel time is 1 min.
if u book 101 and 201, horizontal is 0, vertical is 2 mins, so total 2.

### layout
- floors 1-9 have 10 rooms each
- floor 10 has 7 rooms 
- total 97 rooms as per the problem statement.
