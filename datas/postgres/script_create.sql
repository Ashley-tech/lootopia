CREATE table compte(
	id BIGSERIAL PRIMARY KEY,
	nickname VARCHAR(50) NOT NULL,
	login VARCHAR(50) NOT NULL,
	password VARCHAR(50) NOT NULL,
	password_crypted VARCHAR(200) NOT NULL,
	tel VARCHAR(25) DEFAULT NULL,
	is_partner BOOLEAN NOT NULL,
	brand VARCHAR(56) DEFAULT NULL
);

CREATE table chasse(
	id BIGSERIAL PRIMARY KEY,
	titre VARCHAR(75),
	description TEXT,
	organisateur INTEGER NOT NULL,
	monde VARCHAR(8) CHECK (monde IN ('Privé', 'Publique')) NOT NULL,
	dateFin DATE,
	nbreParticipantsMax INTEGER,
	montant FLOAT DEFAULT 0,
	brand VARCHAR(56),
	url_banniere VARCHAR(5000),
	delai INTEGER,
	latitude FLOAT NOT NULL DEFAULT 0 CHECK (lattitude >= -90 AND lattitude <= 90),
	longitude FLOAT NOT NULL DEFAULT 0 CHECK (longitude >= -180 AND longitude <= 180 ),
	statut VARCHAR(15) NOT NULL,
	nbclicks INTEGER NOT NULL DEFAULT 0,
	nbvues INTEGER NOT NULL DEFAULT 0,
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

CREATE TABLE credit_compte(
	compte INTEGER REFERENCES compte NOT NULL,
	type_monnaie VARCHAR(30) NOT NULL,
	effectif INTEGER CHECK (effectif >= 0) NOT NULL DEFAULT 0
);

CREATE TABLE transaction(
	id BIGSERIAL PRIMARY KEY,
	monnaie VARCHAR(30),
	effectif INTEGER CHECK (effectif > 0) NOT NULL DEFAULT 0,
	prixUnite FLOAT NOT NULL DEFAULT 0,
	prixtotal FLOAT NOT NULL DEFAULT 0,
	date DATE NOT NULL DEFAULT CURRENT_DATE,
	heure TIME NOT NULL DEFAULT CURRENT_TIME,
	compte INTEGER NOT NULL REFERENCES compte,
	code16 CHAR(16) NOT NULL,
	datefinvalidite DATE NOT NULL,
	code3 CHAR(3) NOT NULL
);

CREATE TABLE article(
	id BIGSERIAL PRIMARY KEY,
	nom VARCHAR(100),
	marque VARCHAR(40),
	sousmarque VARCHAR(50),
	type_monnaie VARCHAR(56) NOT NULL,
	nombre_monnaie INTEGER NOT NULL CHECK (nombre_monnaie >= 0),
	vendeur INTEGER REFERENCES compte
);

CREATE TABLE article_achete(
	ref BIGSERIAL PRIMARY KEY,
	article INTEGER NOT NULL REFERENCES article,
	acheteur INTEGER NOT NULL REFERENCES compte,
	date_achat DATE NOT NULL DEFAULT CURRENT_DATE,
	heure_achat TIME NOT NULL DEFAULT CURRENT_TIME
);