CREATE TABLE orders (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  item_name CHAR(50) NOT NULL,
  customer_name VARCHAR(50),
  phone_number VARCHAR(15) NOT NULL,
  email VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  order_number INT NOT NULL
);

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username CHAR(50) NOT NULL,
    pass VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(50) NOT NULL
);
