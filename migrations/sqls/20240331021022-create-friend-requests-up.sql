CREATE TABLE hikari_friend_requests (
	uuid CHAR(36) PRIMARY KEY,
	user INT NOT NULL,
	friend INT NOT NULL,
	createdDate TIMESTAMP NOT NULL,

	FOREIGN KEY (user) REFERENCES aime_user(id)
		ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (friend) REFERENCES aime_user(id)
		ON DELETE CASCADE ON UPDATE CASCADE,
	UNIQUE KEY (user, friend)
);
