CREATE TABLE hikari_team_join_keys (
    id CHAR(10) NOT NULL,
    teamId CHAR(36) NOT NULL,

    remainingUses INT DEFAULT NULL,
    totalUses INT NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    FOREIGN KEY (teamId) REFERENCES hikari_teams(uuid)
        ON DELETE CASCADE ON UPDATE CASCADE
);
