<?php
// Vérifie que l'ID est bien passé en GET
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    die("Paramètre 'id' invalide.");
}

$compteId = (int) $_GET['id'];

// Configuration de la base de données
$host = 'localhost';
$port = '5432';
$dbname = 'lootopia';
$user = 'postgres';
$password = 'root';

try {
    // Connexion à PostgreSQL via PDO
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    die("Erreur de connexion à la base de données : " . $e->getMessage());
}

// Mise à jour du champ is_partner
$sql = "DELETE FROM compte WHERE id = :id";
$stmt = $pdo->prepare($sql);
$stmt->execute(['id' => $compteId]);

// Vérifie si la mise à jour a eu lieu
if ($stmt->rowCount() > 0) {
    header("location: ..");
} else {
    echo "Aucun compte supprimé. Vérifie l'ID.";
}
