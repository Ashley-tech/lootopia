<?php
// Configuration de la base de données
$host = '127.0.0.1';
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

// Requête pour récupérer tous les comptes
$query = "SELECT * FROM Compte ORDER BY id";
$stmt = $pdo->query($query);
$comptes = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Liste des Comptes</title>
    <style>
        body {
            font-family: sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            background: white;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 10px;
        }
        th {
            background: #eee;
        }
    </style>
</head>
<body>
    <h1>Liste des Comptes</h1>

    <?php if (empty($comptes)): ?>
        <p>Aucun compte trouvé.</p>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nickname</th>
                    <th>Login</th>
                    <th>Password</th>
                    <th>Password Crypted</th>
                    <th>Téléphone</th>
                    <th>Partenaire ?</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($comptes as $compte): ?>
                    <tr>
                        <td><?= htmlspecialchars($compte['id']) ?></td>
                        <td><?= htmlspecialchars($compte['nickname']) ?></td>
                        <td><?= htmlspecialchars($compte['login']) ?></td>
                        <td><?= htmlspecialchars($compte['password']) ?></td>
                        <td><?= htmlspecialchars($compte['password_crypted']) ?></td>
                        <td><?= htmlspecialchars($compte['tel']) ?></td>
                        <td>
                            <?= $compte['is_partner'] ? 'Oui' : 'Non' ?>
                            <?php if (!$compte['is_partner']): ?>
                                <button onclick="window.location.href='/controllers/update_partner.php?id=<?= urlencode($compte['id']) ?>'">
                                    Lui faire devenir partenaire
                                </button>
                            <?php endif; ?>
                        </td>
                        <td>
                                <button onclick="window.location.href='/controllers/delete_account.php?id=<?= urlencode($compte['id']) ?>'">
                                    Supprimer ce compte
                                </button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</body>
</html>
