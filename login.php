<?php
/**
 * login.php
 * Handles student, teacher, guardian, accountant, admin, and superadmin login
 */

require_once 'db.php';

$response = [
    "status" => "error",
    "message" => "An unknown login error occurred"
];

$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = isset($input['username']) ? $conn->real_escape_string(trim($input['username'])) : '';
    $password = isset($input['password']) ? $conn->real_escape_string(trim($input['password'])) : '';
    $class = isset($input['class']) ? $conn->real_escape_string(trim($input['class'])) : '';
    $roll = isset($input['roll']) ? $conn->real_escape_string(trim($input['roll'])) : '';
    $phone = isset($input['phone']) ? $conn->real_escape_string(trim($input['phone'])) : '';

    if (!empty($username)) {
        $cleanUser = strtolower($username);
        $cleanPass = strtolower($password);

        if ($cleanUser === 'admin' && ($cleanPass === 'admin' || $cleanPass === 'admin123')) {
            $response = [
                "status" => "success",
                "role" => "admin",
                "message" => "Admin successfully authenticated!",
                "user" => [
                    "name" => "Administrator",
                    "username" => "admin",
                    "role" => "admin"
                ]
            ];
        } else if ($cleanUser === 'teacher' && ($cleanPass === 'teacher' || $cleanPass === 'teacher123')) {
            $response = [
                "status" => "success",
                "role" => "teacher",
                "message" => "Teacher successfully authenticated!",
                "user" => [
                    "name" => "Teacher Panel",
                    "username" => "teacher",
                    "role" => "teacher"
                ]
            ];
        } else if (($cleanUser === 'guardian' || $cleanUser === 'student') && ($cleanPass === 'guardian' || $cleanPass === 'student' || $cleanPass === 'guardian123')) {
            $response = [
                "status" => "success",
                "role" => "student",
                "message" => "Guardian / Student successfully authenticated!",
                "user" => [
                    "name" => "Guardian Portal",
                    "username" => "guardian",
                    "role" => "student"
                ]
            ];
        } else if ($cleanUser === 'accountant' && ($cleanPass === 'accountant' || $cleanPass === 'accountant123')) {
            $response = [
                "status" => "success",
                "role" => "accountant",
                "message" => "Accountant successfully authenticated!",
                "user" => [
                    "name" => "Accounts Department",
                    "username" => "accountant",
                    "role" => "accountant"
                ]
            ];
        } else if ($cleanUser === 'superadmin' && ($cleanPass === 'superadmin' || $cleanPass === 'superadmin123')) {
            $response = [
                "status" => "success",
                "role" => "superadmin",
                "message" => "Super Admin successfully authenticated!",
                "user" => [
                    "name" => "Super Administrator",
                    "username" => "superadmin",
                    "role" => "superadmin"
                ]
            ];
        } else {
            $response['message'] = "Authentication failed: Invalid credentials provided for " . htmlspecialchars($username) . ".";
        }
    } else if (!empty($class) && !empty($roll) && !empty($phone)) {
        // Student login
        $student_check = $conn->query("SELECT * FROM `students` WHERE `class` = '$class' AND `roll` = '$roll' AND `phone` = '$phone' LIMIT 1");
        if ($student_check && $student_check->num_rows > 0) {
            $student = $student_check->fetch_assoc();
            $response = [
                "status" => "success",
                "role" => "student",
                "message" => "Student successfully authenticated!",
                "student" => [
                    "sl" => intval($student['sl']),
                    "roll" => $student['roll'],
                    "name" => $student['name'],
                    "class" => $student['class'],
                    "section" => $student['section'],
                    "photo" => $student['photo']
                ]
            ];
        } else {
            $response['message'] = "Authentication failed: Invalid Class, Roll, or Phone Number combinations.";
        }
    } else {
        $response['message'] = "Bad Request: Missing required parameters.";
    }
} else {
    $response['message'] = "Invalid Request Method. POST required.";
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
