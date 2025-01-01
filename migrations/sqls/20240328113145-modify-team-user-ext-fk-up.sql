ALTER TABLE hikari_user_ext
	DROP CONSTRAINT fk_team;
ALTER TABLE hikari_user_ext
	ADD CONSTRAINT fk_team FOREIGN KEY(team) REFERENCES hikari_teams(uuid)
    ON DELETE SET NULL ON UPDATE CASCADE;
