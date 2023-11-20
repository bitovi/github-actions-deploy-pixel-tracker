-- Create a table for storing trackers
CREATE TABLE IF NOT EXISTS trackers (
    id VARCHAR(255) PRIMARY KEY -- The ID of the tracker
);

-- Create an index on the id column for faster lookups
CREATE INDEX IF NOT EXISTS idx_trackers_id ON trackers (id);

-- Create a table for storing requests
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY, -- The ID of the request
    tracker_id VARCHAR(255) NOT NULL, -- The ID of the tracker associated with this request
    ip_address VARCHAR(50), -- The IP address from which the request was made
    user_agent TEXT, -- The user agent string of the request
    referer TEXT, -- The referer of the request
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP -- The timestamp of the request
);

-- Create an index on the tracker_id column for faster lookups
CREATE INDEX IF NOT EXISTS idx_requests_tracker_id ON requests (tracker_id);

-- Create a foreign key constraint to ensure that every request is associated with a valid tracker
ALTER TABLE requests ADD CONSTRAINT fk_requests_trackers FOREIGN KEY (tracker_id) REFERENCES trackers (id);
