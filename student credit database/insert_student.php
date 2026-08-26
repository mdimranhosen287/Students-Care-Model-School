<?php
/**
 * insert_student.php
 * Endpoint to add a new student from the live website to the MySQL database
 * Accepts JSON Payload or Form Data (with student photo upload)
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

$response = [
    "status" => "error",
    "message" => "Something went wrong"
];

// 1. Read input payload (JSON or POST)
$input_data = [];
$content_type = isset($_SERVER['CONTENT_TYPE']) ? trim($_SERVER['CONTENT_TYPE']) : '';

if (strpos($content_type, 'application/json') !== false) {
    $json_raw = file_get_contents('php://input');
    $input_data = json_decode($json_raw, true) ?: [];
} else {
    $input_data = $_POST;
}

// 2. Extract and sanitize field values
$name = trim($input_data['name'] ?? $input_data['full_name'] ?? $_POST['name'] ?? '');
$name_bn = trim($input_data['name_bn'] ?? $input_data['full_name_bn'] ?? $_POST['name_bn'] ?? '');
$roll = trim($input_data['roll'] ?? $input_data['roll_no'] ?? $_POST['roll'] ?? '');
$class_name = trim($input_data['class_name'] ?? $input_data['class'] ?? $_POST['class_name'] ?? $_POST['class'] ?? '');
$section = trim($input_data['section'] ?? $_POST['section'] ?? 'A');
$shift = trim($input_data['shift'] ?? $_POST['shift'] ?? 'Morning');
$group_name = trim($input_data['group_name'] ?? $input_data['group'] ?? $_POST['group_name'] ?? 'General');
$gender = trim($input_data['gender'] ?? $_POST['gender'] ?? 'Male');
$blood_group = trim($input_data['blood_group'] ?? $_POST['blood_group'] ?? '');
$dob = trim($input_data['dob'] ?? $input_data['date_of_birth'] ?? $_POST['dob'] ?? '');
$religion = trim($input_data['religion'] ?? $_POST['religion'] ?? 'Islam');

// Guardian Info
$father_name = trim($input_data['father_name'] ?? $_POST['father_name'] ?? '');
$father_occupation = trim($input_data['father_occupation'] ?? $_POST['father_occupation'] ?? '');
$mother_name = trim($input_data['mother_name'] ?? $_POST['mother_name'] ?? '');
$mother_occupation = trim($input_data['mother_occupation'] ?? $_POST['mother_occupation'] ?? '');
$guardian_name = trim($input_data['guardian_name'] ?? $input_data['guardian'] ?? $_POST['guardian_name'] ?? ($father_name ?: 'Guardian'));
$guardian_phone = trim($input_data['guardian_phone'] ?? $input_data['phone'] ?? $input_data['phone_number'] ?? $_POST['guardian_phone'] ?? $_POST['phone'] ?? '');
$guardian_relation = trim($input_data['guardian_relation'] ?? $_POST['guardian_relation'] ?? 'Father');

// Address
$present_address = trim($input_data['present_address'] ?? $input_data['address'] ?? $_POST['present_address'] ?? '');
$permanent_address = trim($input_data['permanent_address'] ?? $_POST['permanent_address'] ?? $present_address);

// Session & ID
$session_year = trim($input_data['session_year'] ?? $input_data['session'] ?? $_POST['session_year'] ?? date('Y'));
$student_id = trim($input_data['student_id'] ?? $_POST['student_id'] ?? ('STD-' . $session_year . '-' . rand(1000, 9999)));

$monthly_fee = floatval($input_data['monthly_fee'] ?? $_POST['monthly_fee'] ?? 0.00);
$payment_status = trim($input_data['payment_status'] ?? $_POST['payment_status'] ?? 'Paid');
$due_amount = floatval($input_data['due_amount'] ?? $_POST['due_amount'] ?? 0.00);
$admission_date = trim($input_data['admission_date'] ?? $_POST['admission_date'] ?? date('Y-m-d'));

// Photo Upload Handling
$photo_url = trim($input_data['photo_url'] ?? $input_data['photo'] ?? $_POST['photo_url'] ?? '');

if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $uploads_dir = '../uploads';
    if (!is_dir($uploads_dir)) {
        mkdir($uploads_dir, 0777, true);
    }
    $file_name = $_FILES['photo']['name'];
    $file_tmp  = $_FILES['photo']['tmp_name'];
    $file_ext  = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
    $allowed   = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (in_array($file_ext, $allowed)) {
        $unique_name = 'student_' . time() . '_' . rand(1000, 9999) . '.' . $file_ext;
        $dest_path   = $uploads_dir . '/' . $unique_name;
        if (move_uploaded_file($file_tmp, $dest_path)) {
            $photo_url = 'uploads/' . $unique_name;
        }
    }
}

// 3. Required Fields Validation
if (empty($name) || empty($class_name) || empty($guardian_phone)) {
    http_response_code(400);
    $response['message'] = "Validation error: Student Name, Class Name, and Guardian Phone are required.";
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

// 4. SQL Injection Safe Prepared Statement
$sql = "INSERT INTO `students` (
    `student_id`, `name`, `name_bn`, `roll`, `class_name`, `section`, `shift`, `group_name`,
    `gender`, `blood_group`, `dob`, `religion`, `father_name`, `father_occupation`,
    `mother_name`, `mother_occupation`, `guardian_name`, `guardian_phone`, `guardian_relation`,
    `present_address`, `permanent_address`, `photo_url`, `session_year`, `admission_date`,
    `monthly_fee`, `payment_status`, `due_amount`, `status`
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    $response['message'] = "Prepare failed: " . $conn->error . ". Please make sure the table `students` is created in phpMyAdmin.";
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

$stmt->bind_param(
    "ssssssssssssssssssssssssdsd",
    $student_id, $name, $name_bn, $roll, $class_name, $section, $shift, $group_name,
    $gender, $blood_group, $dob, $religion, $father_name, $father_occupation,
    $mother_name, $mother_occupation, $guardian_name, $guardian_phone, $guardian_relation,
    $present_address, $permanent_address, $photo_url, $session_year, $admission_date,
    $monthly_fee, $payment_status, $due_amount
);

if ($stmt->execute()) {
    $insert_id = $stmt->insert_id;
    $response = [
        "status" => "success",
        "message" => "Student data successfully inserted into MySQL database!",
        "id" => $insert_id,
        "student_id" => $student_id,
        "student" => [
            "id" => $insert_id,
            "student_id" => $student_id,
            "name" => $name,
            "name_bn" => $name_bn,
            "roll" => $roll,
            "class_name" => $class_name,
            "section" => $section,
            "guardian_phone" => $guardian_phone,
            "photo_url" => $photo_url
        ]
    ];
} else {
    http_response_code(500);
    $response['message'] = "Database Execute error: " . $stmt->error;
}

$stmt->close();
$conn->close();

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>
