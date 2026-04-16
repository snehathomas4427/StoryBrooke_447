-- BOOK VALUES
INSERT INTO book VALUES('Harry Potter', 4512, 'JK Rowling', 5, 'boy with magic');
INSERT INTO book VALUES('Jane Eyre', 6642, 'Charlotte Brontë', 2, 'orphaned governess overcomes a traumatic childhood and strict societal limitations to find love, independence, and a sense of belonging');
INSERT INTO book VALUES('To Kill a Mockingbird', 1001, 'Harper Lee', 5, 'racial injustice in the Deep South');
INSERT INTO book VALUES('1984', 1002, 'George Orwell', 5, 'dystopian surveillance society');
INSERT INTO book VALUES('Pride and Prejudice', 1003, 'Jane Austen', 5, 'romance and social class');
INSERT INTO book VALUES('The Great Gatsby', 1004, 'F. Scott Fitzgerald', 4, 'wealth, love, and tragedy in the 1920s');
INSERT INTO book VALUES('Moby Dick', 1005, 'Herman Melville', 3, 'obsession with a white whale');
INSERT INTO book VALUES('The Hobbit', 1006, 'J.R.R. Tolkien', 5, 'hobbit goes on an adventure');
INSERT INTO book VALUES('Lord of the Flies', 1007, 'William Golding', 4, 'boys stranded on an island');
INSERT INTO book VALUES('Harry Potter and the Sorcerers Stone', 1008, 'J.K. Rowling', 5, 'wizard discovers he is famous');
INSERT INTO book VALUES('The Catcher in the Rye', 1011, 'J.D. Salinger', 4, 'teen rebellion and alienation');
INSERT INTO book VALUES('The Alchemist', 1012, 'Paulo Coelho', 5, 'journey to follow your dreams');
INSERT INTO book VALUES('The Da Vinci Code', 1013, 'Dan Brown', 4, 'religious mystery and symbols');
INSERT INTO book VALUES('The Hunger Games', 1014, 'Suzanne Collins', 5, 'fight for survival in a dystopia');
INSERT INTO book VALUES('Catching Fire', 1015, 'Suzanne Collins', 5, 'rebellion grows in the districts');
INSERT INTO book VALUES('Mockingjay', 1016, 'Suzanne Collins', 5, 'final war against the Capitol');
INSERT INTO book VALUES('The Book Thief', 1017, 'Markus Zusak', 5, 'girl steals books in Nazi Germany');
INSERT INTO book VALUES('Animal Farm', 1018, 'George Orwell', 5, 'farm animals overthrow humans');
INSERT INTO book VALUES('The Chronicles of Narnia', 1019, 'C.S. Lewis', 3, 'children discover magical world');
INSERT INTO book VALUES('The Fault in Our Stars', 1020, 'John Green', 4, 'teen romance with illness');

-- USER DATA
INSERT INTO user_profile VALUES('bookLover', 'Andrew Garfield', '2025-01-10');
INSERT INTO user_profile VALUES('alex99', 'Alex Johnson', '2024-11-02');
INSERT INTO user_profile VALUES('maria7', 'Maria Garcia', '2025-02-14');
INSERT INTO user_profile VALUES('johnnyB', 'John Brown', '2024-09-21');
INSERT INTO user_profile VALUES('lisa_k', 'Lisa Kim', '2025-03-01');
INSERT INTO user_profile VALUES('danielx', 'Daniel Xu', '2024-12-12');
INSERT INTO user_profile VALUES('emilyw', 'Emily Wilson', '2025-01-18');
INSERT INTO user_profile VALUES('chrisP', 'Chris Patel', '2024-10-30');
INSERT INTO user_profile VALUES('nina_s', 'Nina Singh', '2025-02-05');
INSERT INTO user_profile VALUES('mikeT', 'Michael Turner', '2024-08-19');
INSERT INTO user_profile VALUES('oliviaR', 'Olivia Reed', '2025-03-10');
INSERT INTO user_profile VALUES('ethanL', 'Ethan Lee', '2024-07-25');
INSERT INTO user_profile VALUES('sophiaM', 'Sophia Martinez', '2025-01-28');
INSERT INTO user_profile VALUES('liamH', 'Liam Harris', '2024-09-14');
INSERT INTO user_profile VALUES('avaG', 'Ava Green', '2025-02-20');
INSERT INTO user_profile VALUES('noahB', 'Noah Bennett', '2024-11-11');
INSERT INTO user_profile VALUES('isabellaC', 'Isabella Clark', '2025-03-15');
INSERT INTO user_profile VALUES('jackD', 'Jack Davis', '2024-12-01');
INSERT INTO user_profile VALUES('miaF', 'Mia Foster', '2025-01-05');
INSERT INTO user_profile VALUES('loganW', 'Logan White', '2024-10-08');

-- REVIEWS
INSERT INTO reviews VALUES(1, 1001, 5, 'Amazing classic!', '2025-01-12 10:30:00');
INSERT INTO reviews VALUES(2, 1002, 5, 'Very thought-provoking', '2025-02-01 14:20:00');
INSERT INTO reviews VALUES(3, 1003, 4, 'Great romance story', '2025-02-10 09:15:00');
INSERT INTO reviews VALUES(4, 1004, 4, 'Loved the symbolism', '2025-02-15 18:45:00');
INSERT INTO reviews VALUES(5, 1005, 3, 'A bit slow but good', '2025-03-01 12:00:00');
INSERT INTO reviews VALUES(6, 1006, 5, 'Fantastic adventure', '2025-03-03 16:10:00');
INSERT INTO reviews VALUES(7, 1007, 4, 'Very deep meaning', '2025-03-05 11:25:00');
INSERT INTO reviews VALUES(8, 1008, 5, 'Magical and fun', '2025-03-07 13:40:00');
INSERT INTO reviews VALUES(9, 1011, 4, 'Relatable teen struggles', '2025-03-10 17:00:00');
INSERT INTO reviews VALUES(10, 1012, 5, 'Life changing book', '2025-03-12 19:30:00');
INSERT INTO reviews VALUES(11, 1013, 4, 'Interesting mystery', '2025-03-14 08:20:00');
INSERT INTO reviews VALUES(12, 1014, 5, 'Very exciting!', '2025-03-16 20:10:00');
INSERT INTO reviews VALUES(13, 1015, 5, 'Even better sequel', '2025-03-18 21:45:00');
INSERT INTO reviews VALUES(14, 1016, 5, 'Great conclusion', '2025-03-20 09:50:00');
INSERT INTO reviews VALUES(15, 1017, 5, 'Very emotional', '2025-03-22 10:05:00');
INSERT INTO reviews VALUES(16, 1018, 5, 'Powerful message', '2025-03-24 14:15:00');
INSERT INTO reviews VALUES(17, 1019, 3, 'Good fantasy world', '2025-03-26 16:30:00');
INSERT INTO reviews VALUES(18, 1020, 4, 'Sad but beautiful', '2025-03-28 18:00:00');
INSERT INTO reviews VALUES(19, 1001, 5, 'Still a masterpiece', '2025-03-29 12:10:00');
INSERT INTO reviews VALUES(20, 1002, 5, 'Scarily relevant', '2025-03-30 13:25:00');

-- READING LOG

INSERT INTO reading_log VALUES('sneha01', 1, 1001, '2025-01-10');
INSERT INTO reading_log VALUES('alex99', 1, 1002, '2025-01-11');
INSERT INTO reading_log VALUES('maria7', 1, 1003, '2025-01-12');
INSERT INTO reading_log VALUES('johnnyB', 1, 1004, '2025-01-13');
INSERT INTO reading_log VALUES('lisa_k', 1, 1005, '2025-01-14');
INSERT INTO reading_log VALUES('danielx', 1, 1006, '2025-01-15');
INSERT INTO reading_log VALUES('emilyw', 1, 1007, '2025-01-16');
INSERT INTO reading_log VALUES('chrisP', 1, 1008, '2025-01-17');
INSERT INTO reading_log VALUES('nina_s', 1, 1011, '2025-01-18');
INSERT INTO reading_log VALUES('mikeT', 1, 1012, '2025-01-19');
INSERT INTO reading_log VALUES('oliviaR', 1, 1013, '2025-01-20');
INSERT INTO reading_log VALUES('ethanL', 1, 1014, '2025-01-21');
INSERT INTO reading_log VALUES('sophiaM', 1, 1015, '2025-01-22');
INSERT INTO reading_log VALUES('liamH', 1, 1016, '2025-01-23');
INSERT INTO reading_log VALUES('avaG', 1, 1017, '2025-01-24');
INSERT INTO reading_log VALUES('noahB', 1, 1018, '2025-01-25');
INSERT INTO reading_log VALUES('isabellaC', 1, 1019, '2025-01-26');
INSERT INTO reading_log VALUES('jackD', 1, 1020, '2025-01-27');
INSERT INTO reading_log VALUES('miaF', 1, 1001, '2025-01-28');
INSERT INTO reading_log VALUES('loganW', 1, 1002, '2025-01-29');