const express = require("express");
const sql = require("mysql");
const inquirer = require("inquirer");
const bcrypt = require("bcrypt");
const consoleTable = require("console.table");
require("dotenv").config();

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// TODO: GLOBAL VARIABLES
const items = [];
let orderNumber;

// * Connect to database
const db = sql.createConnection(
  {
    host: "localhost",
    // MySQL username,
    user: process.env.DB_USER,
    // MySQL password
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  console.log(`Connected to the tester_db database.`)
);

// * This is the switch statement for the answers given in the menu
function questions(answers) {
  switch (answers.options) {
    case "Create Order":
      createOrder();
      break;
    case "Find Order":
      console.log("Finding Order...\n");
      findOrder();
      break;
    case "See Orders":
      seeOrders();
      break;
    case "Create User":
      createUser();
      break;
    case "See Users":
      getUsers();
      break;
    case "Quit":
        process.exit(0);
        break;
    default:
      break;
  }
}

// * This is the main menu options
function menu() {
  console.log("");
  const options = [
    "Create Order",
    "Find Order",
    "See Orders",
    "Create User",
    "See Users",
    "Quit"
  ];
  inquirer
    .prompt([
      {
        type: "list",
        name: "options",
        message: "Choose an option",
        choices: options,
      },
    ])
    .then((answers) => {
      questions(answers);
    });
}

// ! Orders
// * This function fires an inquirer that asks the user to enter an order number
function createOrder() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "order_number",
        message: "Please enter the order number: ",
      },
    ])
    .then((answers) => {
      orderNumber = parseInt(answers.order_number);
      item();
    });
}

// * This function get the item name and the price and adds them to an object that will be pushed to an array
function item() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "item_name",
        message: "Please enter the name of item: ",
      },
      {
        type: "input",
        name: "customer_name",
        message: "Please enter full name: ",
      },
      {
        type: "input",
        name: "phone_number",
        message: "Please enter phone number: ",
      },
      {
        type: "input",
        name: "email",
        message: "Please enter email: ",
      },
      {
        type: "input",
        name: "price",
        message: "Please enter the price: ",
      },
    ])
    .then((answers) => {
      const item = {
        item: answers.item_name,
        customer: answers.customer_name,
        phone: answers.phone_number,
        email: answers.email,
        price: answers.price,
        orderNum: orderNumber,
      };

      items.push(item);
      console.log(items);
      newItems();
    });
}

// * This function asks the user if they want to add an more items to the order
function newItems() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "quit",
        message: "Do you want to add another item(y/n)",
      },
    ])
    .then((answer) => {
      if (answer.quit === "n".toLowerCase()) {
        console.log(items);
        addToDatabase();
      } else if (answer.quit === "y") {
        item();
      } else {
        addToDatabase();
        process.exit(0);
      }
    });
}

// * This function add the values from the items array to the database
function addToDatabase() {
  const values = items.map((item) => [
    item.item,
    item.customer,
    item.phone,
    item.email,
    item.price,
    orderNumber,
  ]);

  const query =
    "INSERT INTO orders (item_name, customer_name, phone_number, email, price, order_number) VALUES ?";
  db.query(query, [values], (err, res) => {
    if (err) throw err;
    console.log(res.affectedRows + " order inserted!\n");
    menu(); // Close the database connection after inserting the orders
  });
}

function findOrder() {
  console.clear();
  inquirer
    .prompt([
      {
        type: "input",
        name: "ordernum",
        message: "Please enter the order number:",
      },
    ])
    .then((number) => {
      const query = "SELECT * FROM orders WHERE order_number = ?";
      db.query(query, [number.ordernum], (err, results) => {
        if (err) throw err;
        console.log("");
        console.log("Items with order number " + number.ordernum + ":");
        console.log("");
        console.table(results);
        // Process the retrieved items as needed
        menu(); // Close the database connection after selecting the items
      });
    });
}

function seeOrders() {
  console.clear();
  const query =
    "SELECT order_number, customer_name, phone_number, SUM(price) FROM orders GROUP BY order_number, customer_name, phone_number";
  db.query(query, (err, results) => {
    if (err) throw err;

    // Create an array to store unique order numbers
    const uniqueOrderNumbers = [];

    // Filter the results to keep only unique order numbers
    const filteredResults = results.filter((row) => {
      const orderNumber = row.order_number;
      if (!uniqueOrderNumbers.includes(orderNumber)) {
        uniqueOrderNumbers.push(orderNumber);
        return true;
      }
      return false;
    });

    console.log("");
    console.log("Unique order numbers:");
    console.log("");
    console.table(filteredResults);
    // Process the retrieved order numbers as needed
    menu();
  });
}

// ! Find and creating user

function createUser() {
  console.clear();
  inquirer
    .prompt([
      {
        type: "input",
        name: "username",
        message: "First and Last name:",
      },
      {
        type: "input",
        name: "password",
        message: "Enter a password:",
      },
      {
        type: "input",
        name: "phone",
        message: "Phone Number:",
      },
      {
        type: "input",
        name: "email",
        message: "Email:",
      },
    ])
    .then((answer) => {
      const { username, password, phone, email } = answer;
      const saltRounds = 10;

      bcrypt.hash(password, saltRounds, (error, hashedPassword) => {
        if (error) {
          console.error("Error hashing password:", error);
        } else {
          const query =
            "INSERT INTO users (username, pass, phone, email) VALUES (?, ?, ?, ?)";
          db.query(
            query,
            [username, hashedPassword, phone, email],
            (error, results) => {
              if (error) {
                console.error("Error creating user:", error);
              } else {
                console.log("User created successfully!");
              }
              menu();
            }
          );
        }
      });
    });
}

function getUsers() {
  console.clear();
  const query = "SELECT * FROM users"; // SQL query to fetch all rows from the 'users' table

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      console.log("Users:");
      console.table(results); // Results contains an array of objects representing the fetched rows
    }
    menu();
  });
}

// * Function to retrieve user from database by username
function getUserByUsername(username, callback) {
  const query = "SELECT * FROM users WHERE username = ? LIMIT 1"; // SQL query to fetch user by username
  db.query(query, [username], (error, results) => {
    if (error) {
      console.error("Error fetching user:", error);
      callback(error, null);
    } else {
      if (results.length === 0) {
        console.log("User not found");
        callback(null, null); // User not found, pass null as result
      } else {
        const user = results[0]; // Fetch the user object
        callback(null, user);
      }
    }
  });
}

// * Function to compare entered password with stored hashed password
function comparePassword(enteredPassword, storedHashedPassword, callback) {
  bcrypt.compare(enteredPassword, storedHashedPassword, (error, isMatch) => {
    if (error) {
      console.error("Error comparing passwords:", error);
      callback(error, null);
    } else {
      callback(null, isMatch); // Pass the result of password comparison
    }
  });
}

// *  Function to handle login process
function login() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "username",
        message: "Enter your username:",
      },
      {
        type: "password",
        name: "password",
        message: "Enter your password:",
      },
    ])
    .then((answers) => {
      const { username, password } = answers;

      // Retrieve user from database by username
      getUserByUsername(username, (error, user) => {
        if (error) {
          console.error("Error retrieving user:", error);
        } else {
          if (!user) {
            console.log("User not found");
            // Handle user not found case (e.g. show error message)
            return;
          }

          // Compare entered password with stored hashed password
          comparePassword(password, user.pass, (error, isMatch) => {
            if (error) {
              console.error("Error comparing passwords:", error);
            } else {
              if (isMatch) {
                console.log("Password match"); // Passwords match, allow login
                // Call your menu() function here
                menu();
              } else {
                console.log("Password mismatch");
                // Handle incorrect password case (e.g. show error message)
              }
            }
          });
        }
      });
    });
}

console.clear();
login();

// Default response for any other request (Not Found)
app.use((req, res) => {
  res.status(404).end();
});

app.listen(PORT, () => {
  //   console.log(`Server running on port ${PORT}`);
});
