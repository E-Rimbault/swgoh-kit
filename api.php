<?php
// Activer les erreurs (en développement uniquement)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// En-têtes pour autoriser le CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS pour CORS (pré-vol)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Vérifier si la requête contient du JSON
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['allyCode'])) {
    echo json_encode(["error" => "Code allié manquant"]);
    exit();
}

// Nettoyage du code allié
$ally_code = preg_replace('/[^0-9]/', '', $input['allyCode']);

// Vérifier la longueur du code allié
if (strlen($ally_code) < 6 || strlen($ally_code) > 12) {
    echo json_encode(["error" => "Code allié invalide"]);
    exit();
}

// URL de l'API publique SWGOH.gg
$api_url = "https://swgoh.gg/api/player/{$ally_code}/";

// Récupération des données via l'API
$response = @file_get_contents($api_url);

// Vérification de la réponse
if (!$response) {
    echo json_encode(["error" => "Impossible de récupérer les données"]);
    exit();
}

// Décodage du JSON
$data = json_decode($response, true);

// Vérifier si les données sont valides
if (!$data || !isset($data['units'])) {
    echo json_encode(["error" => "Aucun personnage trouvé"]);
    exit();
}

// Construire la réponse
$characters = [];
foreach ($data['units'] as $unit) {
    $unit_data = $unit['data'];
    if (isset($unit_data['name'], $unit_data['level'], $unit_data['rarity'], $unit_data['gear_level'], $unit_data['power'], $unit_data['base_id'])) {
        $characters[] = [
            'name' => $unit_data['name'],
            'level' => $unit_data['level'],
            'rarity' => $unit_data['rarity'],
            'gear_level' => $unit_data['gear_level'],
            'power' => $unit_data['power'],
            'image' => "https://swgoh.gg/static/img/assets/characters/{$unit_data['base_id']}.png"
        ];
    }
}

// Trier et envoyer la réponse JSON
usort($characters, fn($a, $b) => strcmp($a['name'], $b['name']));
echo json_encode(["characters" => $characters], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
