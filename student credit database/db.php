<?php
/**
 * db.php
 * Database Connection Configuration for Students Care Model School
 * Hostinger MySQL Database
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$servername = "localhost";
$username   = "u451653929_admin";
$password   = "Cisfa1998$#@";
$dbname     = "u451653929_StudentsCare";

// Create Connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check Connection
if ($conn->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $conn->connect_error
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Set UTF-8 encoding for Bengali and Unicode support
$conn->set_charset("utf8mb4");
?>
