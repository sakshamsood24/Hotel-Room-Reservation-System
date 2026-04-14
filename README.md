# Unstop Hotel Room Reservation System

Hey, this is my submission for the SDE 3 assessment.

### How to run:
1. go into the backend folder and run `npm install` then `npm start`
   it will run on port 5001.
2. for the frontend you can just open `frontend/index.html` in your browser. Or you can run `npm start` inside frontend if u want to serve it locally.

Note: if you see cors errors, make sure the backend is fully running on 5001 before hitting it from the ui. 

### Features implemented
- Book rooms (1 to 5 max)
- Prioritizes same floor. if not possible, it will look for rooms that minimize the travel time across floors. (1 min for adjacent on same floor, 2 mins per floor vertical).
- Random occupancy generator button
- Reset button
- UI shows all 10 floors and available/booked rooms

### logic
most of the important stuff is in `backend/server.js`.
the `findOptimalBooking` function handles the finding the best rooms based on the travel time logic.

let me know if you face any issues viewing the live link.
