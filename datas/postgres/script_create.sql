CREATE table compte(
	id BIGSERIAL PRIMARY KEY,
	nickname VARCHAR(50) NOT NULL,
	login VARCHAR(50) NOT NULL,
	password VARCHAR(50) NOT NULL,
	password_crypted VARCHAR(200) NOT NULL,
	tel VARCHAR(25) DEFAULT NULL,
	is_partner BOOLEAN NOT NULL
);

CREATE table chasse(
	id BIGSERIAL PRIMARY KEY,
	titre VARCHAR(75),
	description TEXT,
	organisateur INTEGER NOT NULL,
	monde VARCHAR(7) CHECK (monde IN ('Privé', 'Publique')) NOT NULL,
	dateFin DATE,
	nbreParticipantsMax INTEGER,
	montant FLOAT DEFAULT 0,
	delai INTEGER,
	statut VARCHAR(15) NOT NULL,
	nbclicks INTEGER NOT NULL DEFAULT 0,
	CONSTRAINT fk_org FOREIGN KEY (organisateur) REFERENCES compte(id)
);

CREATE table participation(
	id BIGSERIAL PRIMARY KEY,
	joueur INTEGER NOT NULL,
	chasse INTEGER NOT NULL,
	note FLOAT CHECK (note >= 10),
	CONSTRAINT fk_joueur FOREIGN KEY (joueur) references compte(id),
	CONSTRAINT fk_ch FOREIGN KEY (chasse) references chasse(id)
);