<?php
/**
 * reset_password.php
 * Handles student verification and contact phone update (serving as resetting student portal access password/phone)
 */

require_once 'db.php';

$response = [
    "status" => "error",
    "message" => "An unknown reset error occurred"
];

$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $class = isset($input['class']) ? $conn->real_escape_string(trim($input['class'])) : '';
    $roll = isset($input['roll']) ? $conn->real_escape_string(trim($input['roll'])) : '';
    $phone = isset($input['phone']) ? $conn->real_escape_string(trim($input['phone'])) : '';
    $new_phone = isset($input['new_phone']) ? $conn->real_escape_string(trim($input['new_phone'])) : '';

    if (empty($class) || empty($roll) || empty($phone)) {
        $response['message'] = "Validation Failed: Roll, Class, and Current Phone are required.";
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit();
    }

    $verify_query = $conn->query("SELECT * FROM `students` WHERE `class` = '$class' AND `roll` = '$roll' AND `phone` = '$phone' LIMIT 1");
    if ($verify_query && $verify_query->num_rows > 0) {
        $student = $verify_query->fetch_assoc();

        if (empty($new_phone)) {
            // Just verifying identity
            $response = [
                "status" => "success",
                "message" => "Student identity verified successfully.",
                "student" => [
                    "name" => $student['name']
                ]
            ];
        } else {
            // Updating the contact phone
            $update_res = $conn->query("UPDATE `students` SET `phone` = '$new_phone' WHERE `sl` = " . $student['sl']);
            if ($update_res) {
                $response = [
                    "status" => "success",
                    "message" => "Student phone contact details successfully updated in the database!"
                ];
            } else {
                $response['message'] = "Failed to update phone number in database: " . $conn->error;
            }
        }
    } else {
        $response['message'] = "Verification failed: Student record matching these details was not found.";
    }
} else {
    $response['message'] = "Invalid Request Method. POST required.";
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
