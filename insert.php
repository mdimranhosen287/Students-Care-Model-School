<?php
/**
 * insert.php
 * Handles student registration and photo upload (Supports both JSON and Form POST)
 */

require_once 'db.php';

$response = [
    "status" => "error",
    "message" => "An unknown error occurred"
];

$input_data = [];
$content_type = isset($_SERVER['CONTENT_TYPE']) ? trim($_SERVER['CONTENT_TYPE']) : '';

if (strpos($content_type, 'application/json') !== false) {
    $json_raw = file_get_contents('php://input');
    $input_data = json_decode($json_raw, true) ?: [];
} else {
    $input_data = $_POST;
}

$roll = isset($input_data['roll_no']) ? $conn->real_escape_string(trim($input_data['roll_no'])) : (isset($input_data['roll']) ? $conn->real_escape_string(trim($input_data['roll'])) : (isset($_POST['roll_no']) ? $conn->real_escape_string(trim($_POST['roll_no'])) : (isset($_POST['roll']) ? $conn->real_escape_string(trim($_POST['roll'])) : '')));

$name = isset($input_data['full_name']) ? $conn->real_escape_string(trim($input_data['full_name'])) : (isset($input_data['name']) ? $conn->real_escape_string(trim($input_data['name'])) : (isset($_POST['full_name']) ? $conn->real_escape_string(trim($_POST['full_name'])) : (isset($_POST['name']) ? $conn->real_escape_string(trim($_POST['name'])) : '')));

$class = isset($input_data['class']) ? $conn->real_escape_string(trim($input_data['class'])) : (isset($input_data['class_name']) ? $conn->real_escape_string(trim($input_data['class_name'])) : (isset($_POST['class']) ? $conn->real_escape_string(trim($_POST['class'])) : ''));

$section = isset($input_data['section']) ? $conn->real_escape_string(trim($input_data['section'])) : (isset($_POST['section']) ? $conn->real_escape_string(trim($_POST['section'])) : 'A');

$guardian = isset($input_data['guardian_name']) ? $conn->real_escape_string(trim($input_data['guardian_name'])) : (isset($input_data['guardian']) ? $conn->real_escape_string(trim($input_data['guardian'])) : (isset($_POST['guardian_name']) ? $conn->real_escape_string(trim($_POST['guardian_name'])) : (isset($_POST['guardian']) ? $conn->real_escape_string(trim($_POST['guardian'])) : 'N/A')));

$phone = isset($input_data['phone_number']) ? $conn->real_escape_string(trim($input_data['phone_number'])) : (isset($input_data['phone']) ? $conn->real_escape_string(trim($input_data['phone'])) : (isset($input_data['mobile_number']) ? $conn->real_escape_string(trim($input_data['mobile_number'])) : (isset($_POST['phone_number']) ? $conn->real_escape_string(trim($_POST['phone_number'])) : (isset($_POST['phone']) ? $conn->real_escape_string(trim($_POST['phone'])) : ''))));

$address = isset($input_data['address']) ? $conn->real_escape_string(trim($input_data['address'])) : (isset($_POST['address']) ? $conn->real_escape_string(trim($_POST['address'])) : '');

$gender = isset($input_data['gender']) ? $conn->real_escape_string(trim($input_data['gender'])) : (isset($_POST['gender']) ? $conn->real_escape_string(trim($_POST['gender'])) : 'Male');

$dob = isset($input_data['date_of_birth']) ? $conn->real_escape_string(trim($input_data['date_of_birth'])) : (isset($_POST['date_of_birth']) ? $conn->real_escape_string(trim($_POST['date_of_birth'])) : '');

$photo = isset($input_data['photo']) ? $conn->real_escape_string(trim($input_data['photo'])) : (isset($input_data['image']) ? $conn->real_escape_string(trim($input_data['image'])) : '');

if (empty($roll) || empty($name) || empty($class) || empty($phone)) {
    $response['message'] = "Validation Failed: Roll No, Full Name, Class, and Phone Number are mandatory.";
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

$student_id = 'STD-2026-' . rand(1000, 9999);

// Handle file upload if present
$photo_path = $photo;
if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $uploads_dir = 'uploads';
    if (!is_dir($uploads_dir)) {
        mkdir($uploads_dir, 0777, true);
    }

    $file_name = $_FILES['photo']['name'];
    $file_tmp = $_FILES['photo']['tmp_name'];
    $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

    $allowed_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (in_array($file_ext, $allowed_exts)) {
        $unique_name = 'student_' . time() . '_' . rand(1000, 9999) . '.' . $file_ext;
        $dest_file = $uploads_dir . '/' . $unique_name;
        if (move_uploaded_file($file_tmp, $dest_file)) {
            $photo_path = $dest_file;
        }
    }
}

$insert_query = "INSERT INTO `students` (`student_id`, `full_name`, `class`, `section`, `roll_no`, `gender`, `date_of_birth`, `guardian_name`, `phone_number`, `address`) VALUES ('$student_id', '$name', '$class', '$section', '$roll', '$gender', '$dob', '$guardian', '$phone', '$address')";

if ($conn->query($insert_query)) {
    $last_id = $conn->insert_id;
    $response = [
        "status" => "success",
        "message" => "Student record has been successfully inserted into database table!",
        "student" => [
            "id" => $last_id,
            "student_id" => $student_id,
            "full_name" => $name,
            "name" => $name,
            "class" => $class,
            "section" => $section,
            "roll_no" => $roll,
            "roll" => $roll,
            "gender" => $gender,
            "date_of_birth" => $dob,
            "guardian_name" => $guardian,
            "phone_number" => $phone,
            "address" => $address,
            "photo" => $photo_path ? $photo_path : ""
        ]
    ];
} else {
    $response['message'] = "Database insert failed: " . $conn->error;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();

