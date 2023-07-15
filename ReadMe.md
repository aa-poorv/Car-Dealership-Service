1. SetUp

step 1: run npm install to install dependencies
step 2: then to seed the database first run node collectionSeed.js and then run node dataSeed.js.
step 3: install thunderclient or postman for sending requests. and run nodemon index.js

2. API Reference

$ Auth

step 1: first to authenticate the user pass email and password from user or dealership whichever
we want to login to operate on.(you can find password to enter in realPassword field) sending
postrequest on endpoint http://localhost:3000/auth/login
step 2: Now copy the access token for further authentication process to access user and dealership API's
that is paste it in bearer token section.
step 3: For logout of that account just send post request to http://localhost:3000/auth/logout
step 4: As the assigned access token will expire after 10 minutes so to get fresh access token send request
to http://localhost:3000/auth/refresh-token and get new access token.
step 5: To change password send post request to http://localhost:3000/auth/changePassword and pass new password
in body in json format.

$ User(first login in any user to access these)

1. To view all cars send get request to http://localhost:3000/dealer/AllCars
2. To view all cars in a dealership send get request to http://localhost:3000/user/dealership-cars/id here id is
   \_id of dealership whose car we enquired to
3. To view dealerships with a certain car we send get request to http://localhost:3000/user/dealerships where we
   pass queries to filter the type of car we want.
4. To view all vehicles owned by user we send get request to http://localhost:3000/user/cars.
5. To view the dealerships within a certain range based on user location we send get request to http://localhost:3000/user/dealershipNearby
6. To view all deals on a certain car send get request to http:/?localhost:3000/user/deals where we pass queries
   to filter the type of car we want deals for.
7. To view all deals from a certain dealership we send get request to http://localhost:3000/user/deals/id where
   id is the \_id of dealership.
8. To allow user to buy a car after a deal is made we send post request to http://localhost:3000/user/buyCar/id
   where id is \_id of car to be buyed.

$ dealer(first login in any dealer list to get access to the endpoints)

1. To view all cars send get request to http://localhost:3000/dealer/AllCars.
2. To view all cars sold by dealership send get request to http://localhost:3000/dealer/soldCars.
3. To add cars to dealership send post request to http://localhost:3000/dealer/addCar/:id here id is \_id of car
   to be added to that dealership.
4. To view deals provided by dealership send get request to http://localhost:3000/dealer/deals.
5. To add deals to dealership post request to http://localhost:3000/dealer/addDeal/:id here id is \_id of car to
   be added to deal with.
6. To view all vehicles dealership has sold send get request to http://localhost:3000/dealer/vehiclesSold.
7. To add new vehicle to the list of sold vehicles after a deal is made, send post request to http://localhost:3000/dealer/addSoldCar/:id
   here id is \_id of car that has been sold already from dealership.

Note:- user can access dealership API endpoint by adding Admin: 5150 to roles field and similarly dealer can access
user API by adding Admin: 5150 to roles in dealer.
