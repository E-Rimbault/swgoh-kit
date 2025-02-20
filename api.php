<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");

// Fonction pour envoyer une réponse JSON
function sendJsonResponse($data) {
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

// Récupère le code allié depuis la requête JSON
$input = json_decode(file_get_contents("php://input"), true);
$ally_code = isset($input['allyCode']) ? str_replace("-", "", $input['allyCode']) : null;

// Vérifie si le code allié est valide
if (!$ally_code) {
    sendJsonResponse(["error" => "Code allié manquant"]);
}

// Utilisation de l'API publique de SWGOH.gg
$api_url = "https://swgoh.gg/api/player/{$ally_code}/";

// Récupération des données avec file_get_contents
$response = @file_get_contents($api_url);

// Vérification de la réponse
if ($response === false) {
    sendJsonResponse(["error" => "Erreur API SWGOH.gg"]);
}

// Décoder les données JSON
$data = json_decode($response, true);

// Vérifier si les données sont bien récupérées
if (!$data || !isset($data['units'])) {
    sendJsonResponse(["error" => "Aucun personnage trouvé"]);
}

// Extraire les informations des personnages
$characters = [];
foreach ($data['units'] as $unit) {
    $unit_data = $unit['data'];
    $characters[] = [
        'name' => $unit_data['name'],
        'level' => $unit_data['level'],
        'rarity' => $unit_data['rarity'],
        'gear_level' => $unit_data['gear_level'],
        'power' => $unit_data['power'],
        'image' => "https://swgoh.gg/static/img/assets/characters/{$unit_data['base_id']}.png"
    ];
}

// Trier les personnages par ordre alphabétique du nom
usort($characters, function($a, $b) {
    return strcmp($a['name'], $b['name']);
});

// Retourner les personnages du joueur triés par nom
sendJsonResponse(["characters" => $characters]);
?>
