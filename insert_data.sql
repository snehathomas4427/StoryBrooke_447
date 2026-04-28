-- seed data for the storybrooke aiven mysql database
-- has to match the tables that server js initDb makes
--   user_profile username name date_joined
--   book isbn title author average_rating summary
--   review review_id username isbn star_rating review_text time_posted
--   reading_log_entry username entry_id isbn date_finished is_favorite
--
-- using insert ignore so i can run this multiple times without it blowing up on duplicate keys

-- =========================
-- users go first so the foreign keys on reviews and reading log can find them
-- =========================
INSERT IGNORE INTO user_profile (username, name, date_joined) VALUES
  ('bookLover',  'Andrew Garfield',  '2025-01-10'),
  ('alex99',     'Alex Johnson',     '2024-11-02'),
  ('maria7',     'Maria Garcia',     '2025-02-14'),
  ('johnnyB',    'John Brown',       '2024-09-21'),
  ('lisa_k',     'Lisa Kim',         '2025-03-01'),
  ('danielx',    'Daniel Xu',        '2024-12-12'),
  ('emilyw',     'Emily Wilson',     '2025-01-18'),
  ('chrisP',     'Chris Patel',      '2024-10-30'),
  ('nina_s',     'Nina Singh',       '2025-02-05'),
  ('mikeT',      'Michael Turner',   '2024-08-19'),
  ('oliviaR',    'Olivia Reed',      '2025-03-10'),
  ('ethanL',     'Ethan Lee',        '2024-07-25'),
  ('sophiaM',    'Sophia Martinez',  '2025-01-28'),
  ('liamH',      'Liam Harris',      '2024-09-14'),
  ('avaG',       'Ava Green',        '2025-02-20'),
  ('noahB',      'Noah Bennett',     '2024-11-11'),
  ('isabellaC',  'Isabella Clark',   '2025-03-15'),
  ('jackD',      'Jack Davis',       '2024-12-01'),
  ('miaF',       'Mia Foster',       '2025-01-05'),
  ('loganW',     'Logan White',      '2024-10-08');

-- =========================
-- books
-- isbn is varchar 20 in the real schema so we quote it as a string
-- got bit by this earlier when isbns came in as ints and rows went into wrong columns
-- =========================
INSERT IGNORE INTO book (isbn, title, author, average_rating, summary) VALUES
  ('4512', 'Harry Potter',                          'JK Rowling',          5, 'boy with magic'),
  ('6642', 'Jane Eyre',                             'Charlotte Brontë',    2, 'orphaned governess overcomes a traumatic childhood and strict societal limitations to find love, independence, and a sense of belonging'),
  ('1001', 'To Kill a Mockingbird',                 'Harper Lee',          5, 'racial injustice in the Deep South'),
  ('1002', '1984',                                  'George Orwell',       5, 'dystopian surveillance society'),
  ('1003', 'Pride and Prejudice',                   'Jane Austen',         5, 'romance and social class'),
  ('1004', 'The Great Gatsby',                      'F. Scott Fitzgerald', 4, 'wealth, love, and tragedy in the 1920s'),
  ('1005', 'Moby Dick',                             'Herman Melville',     3, 'obsession with a white whale'),
  ('1006', 'The Hobbit',                            'J.R.R. Tolkien',      5, 'hobbit goes on an adventure'),
  ('1007', 'Lord of the Flies',                     'William Golding',     4, 'boys stranded on an island'),
  ('1008', 'Harry Potter and the Sorcerers Stone',  'J.K. Rowling',        5, 'wizard discovers he is famous'),
  ('1011', 'The Catcher in the Rye',                'J.D. Salinger',       4, 'teen rebellion and alienation'),
  ('1012', 'The Alchemist',                         'Paulo Coelho',        5, 'journey to follow your dreams'),
  ('1013', 'The Da Vinci Code',                     'Dan Brown',           4, 'religious mystery and symbols'),
  ('1014', 'The Hunger Games',                      'Suzanne Collins',     5, 'fight for survival in a dystopia'),
  ('1015', 'Catching Fire',                         'Suzanne Collins',     5, 'rebellion grows in the districts'),
  ('1016', 'Mockingjay',                            'Suzanne Collins',     5, 'final war against the Capitol'),
  ('1017', 'The Book Thief',                        'Markus Zusak',        5, 'girl steals books in Nazi Germany'),
  ('1018', 'Animal Farm',                           'George Orwell',       5, 'farm animals overthrow humans'),
  ('1019', 'The Chronicles of Narnia',              'C.S. Lewis',          3, 'children discover magical world'),
  ('1020', 'The Fault in Our Stars',                'John Green',          4, 'teen romance with illness');

-- =========================
-- reviews
-- review needs a username because of the fk to user_profile
-- review_id is auto increment but we set explicit ids here so the seed is reproducible
-- =========================
INSERT IGNORE INTO review (review_id, username, isbn, star_rating, review_text, time_posted) VALUES
  ( 1, 'bookLover', '1001', 5, 'Amazing classic!',         '2025-01-12 10:30:00'),
  ( 2, 'alex99',    '1002', 5, 'Very thought-provoking',   '2025-02-01 14:20:00'),
  ( 3, 'maria7',    '1003', 4, 'Great romance story',      '2025-02-10 09:15:00'),
  ( 4, 'johnnyB',   '1004', 4, 'Loved the symbolism',      '2025-02-15 18:45:00'),
  ( 5, 'lisa_k',    '1005', 3, 'A bit slow but good',      '2025-03-01 12:00:00'),
  ( 6, 'danielx',   '1006', 5, 'Fantastic adventure',      '2025-03-03 16:10:00'),
  ( 7, 'emilyw',    '1007', 4, 'Very deep meaning',        '2025-03-05 11:25:00'),
  ( 8, 'chrisP',    '1008', 5, 'Magical and fun',          '2025-03-07 13:40:00'),
  ( 9, 'nina_s',    '1011', 4, 'Relatable teen struggles', '2025-03-10 17:00:00'),
  (10, 'mikeT',     '1012', 5, 'Life changing book',       '2025-03-12 19:30:00'),
  (11, 'oliviaR',   '1013', 4, 'Interesting mystery',      '2025-03-14 08:20:00'),
  (12, 'ethanL',    '1014', 5, 'Very exciting!',           '2025-03-16 20:10:00'),
  (13, 'sophiaM',   '1015', 5, 'Even better sequel',       '2025-03-18 21:45:00'),
  (14, 'liamH',     '1016', 5, 'Great conclusion',         '2025-03-20 09:50:00'),
  (15, 'avaG',      '1017', 5, 'Very emotional',           '2025-03-22 10:05:00'),
  (16, 'noahB',     '1018', 5, 'Powerful message',         '2025-03-24 14:15:00'),
  (17, 'isabellaC', '1019', 3, 'Good fantasy world',       '2025-03-26 16:30:00'),
  (18, 'jackD',     '1020', 4, 'Sad but beautiful',        '2025-03-28 18:00:00'),
  (19, 'miaF',      '1001', 5, 'Still a masterpiece',      '2025-03-29 12:10:00'),
  (20, 'loganW',    '1002', 5, 'Scarily relevant',         '2025-03-30 13:25:00');

-- =========================
-- reading log
-- table is reading_log_entry pk is username plus entry_id and there is an is_favorite flag
-- the old sneha01 row got remapped to bookLover because sneha01 was never in user_profile
-- and the fk would reject it
-- =========================
INSERT IGNORE INTO reading_log_entry (username, entry_id, isbn, date_finished, is_favorite) VALUES
  ('bookLover', 1, '1001', '2025-01-10', FALSE),
  ('alex99',    1, '1002', '2025-01-11', FALSE),
  ('maria7',    1, '1003', '2025-01-12', FALSE),
  ('johnnyB',   1, '1004', '2025-01-13', FALSE),
  ('lisa_k',    1, '1005', '2025-01-14', FALSE),
  ('danielx',   1, '1006', '2025-01-15', FALSE),
  ('emilyw',    1, '1007', '2025-01-16', FALSE),
  ('chrisP',    1, '1008', '2025-01-17', FALSE),
  ('nina_s',    1, '1011', '2025-01-18', FALSE),
  ('mikeT',     1, '1012', '2025-01-19', FALSE),
  ('oliviaR',   1, '1013', '2025-01-20', FALSE),
  ('ethanL',    1, '1014', '2025-01-21', FALSE),
  ('sophiaM',   1, '1015', '2025-01-22', FALSE),
  ('liamH',     1, '1016', '2025-01-23', FALSE),
  ('avaG',      1, '1017', '2025-01-24', FALSE),
  ('noahB',     1, '1018', '2025-01-25', FALSE),
  ('isabellaC', 1, '1019', '2025-01-26', FALSE),
  ('jackD',     1, '1020', '2025-01-27', FALSE),
  ('miaF',      1, '1001', '2025-01-28', FALSE),
  ('loganW',    1, '1002', '2025-01-29', FALSE);

-- =========================
-- after seeding reviews recompute each books average rating
-- so the books table actually matches the reviews we just inserted
-- =========================
UPDATE book b
SET average_rating = (
  SELECT COALESCE(AVG(r.star_rating), 0)
  FROM review r
  WHERE r.isbn = b.isbn
);
