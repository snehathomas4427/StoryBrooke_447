CREATE TABLE IF NOT EXISTS book(
    Title VARCHAR(255),
    ISBN INT PRIMARY KEY,
    Author VARCHAR(255),
    AverageRating INT,
    Summary VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS user_profile(
    username VARCHAR(100) PRIMARY KEY,
    actual_name VARCHAR(255),
    date_joined DATE
);

CREATE TABLE IF NOT EXISTS reviews(
    review_id INT PRIMARY KEY,
    ISBN INT,
    star_rating INT,
    review_text VARCHAR(255),
    time_posted DATETIME,
    FOREIGN KEY (ISBN) REFERENCES book(ISBN)
);

CREATE TABLE IF NOT EXISTS reading_log(
    username VARCHAR(100),
    entry_id INT,
    ISBN INT,
    date_finished DATE,
    PRIMARY KEY (username, entry_id),
    FOREIGN KEY (username) REFERENCES user_profile(username),
    FOREIGN KEY (ISBN) REFERENCES book(ISBN)
);