<?php
/**
 * save_frontend_data.php
 * Saves bulk website frontend config JSON to database
 */

require_once 'db.php';

$response = [
    "status" => "error",
    "message" => "An unknown save error occurred"
];

$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $frontend_json = null;
    
    if (isset($input['frontend_data'])) {
        $frontend_json = is_string($input['frontend_data']) ? $input['frontend_data'] : json_encode($input['frontend_data'], JSON_UNESCAPED_UNICODE);
    } else if (isset($_POST['frontend_data'])) {
        $frontend_json = $_POST['frontend_data'];
    } else if (!empty($raw_input) && $input !== null) {
        $frontend_json = json_encode($input, JSON_UNESCAPED_UNICODE);
    }

    if (!empty($frontend_json)) {
        // Sanitize
        $escaped_json = $conn->real_escape_string($frontend_json);
        
        // Update the database settings table's first row
        $update_res = $conn->query("UPDATE `settings` SET `frontend_data` = '$escaped_json' LIMIT 1");
        
        if ($update_res) {
            $response = [
                "status" => "success",
                "message" => "Frontend settings saved successfully to server!"
            ];
        } else {
            $response['message'] = "Failed to write settings to database: " . $conn->error;
        }
    } else {
        $response['message'] = "Validation failed: frontend_data payload is empty.";
    }
} else {
    $response['message'] = "Invalid Request Method. POST required.";
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
