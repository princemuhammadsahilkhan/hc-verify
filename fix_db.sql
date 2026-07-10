
ALTER TABLE elections RENAME COLUMN election_name TO title;
ALTER TABLE elections RENAME COLUMN start_date TO date;
ALTER TABLE elections RENAME COLUMN election_type TO status;
ALTER TABLE elections DROP COLUMN end_date;

