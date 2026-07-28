<?php
/**
 * insert.php
 * Handles student registration and photo upload
 */

require_once 'db.php';

$response = [
    "status" => "error",
    "message" => "An unknown error occurred"
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $roll = isset($_POST['roll']) ? $conn->real_escape_string(trim($_POST['roll'])) : '';
    $name = isset($_POST['name']) ? $conn->real_escape_string(trim($_POST['name'])) : '';
    $class = isset($_POST['class']) ? $conn->real_escape_string(trim($_POST['class'])) : '';
    $section = isset($_POST['section']) ? $conn->real_escape_string(trim($_POST['section'])) : 'A';
    $guardian = isset($_POST['guardian']) ? $conn->real_escape_string(trim($_POST['guardian'])) : 'N/A';
    $phone = isset($_POST['phone']) ? $conn->real_escape_string(trim($_POST['phone'])) : '';

    if (empty($roll) || empty($name) || empty($class) || empty($phone)) {
        $response['message'] = "Validation Failed: Roll, Name, Class, and Phone Number are mandatory.";
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Check duplicate in the same class
    $duplicate_check = $conn->query("SELECT * FROM `students` WHERE `class` = '$class' AND `roll` = '$roll' LIMIT 1");
    if ($duplicate_check && $duplicate_check->num_rows > 0) {
        $response['message'] = "Integrity constraint violation: This roll number is already taken in this class.";
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Handle file upload
    $photo_path = '';
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

    $insert_query = "INSERT INTO `students` (`photo`, `roll`, `name`, `class`, `section`, `guardian`, `phone`) VALUES ('$photo_path', '$roll', '$name', '$class', '$section', '$guardian', '$phone')";
    if ($conn->query($insert_query)) {
        $last_id = $conn->insert_id;
        $response = [
            "status" => "success",
            "message" => "Student record has been successfully inserted into the database table!",
            "student" => [
                "sl" => $last_id,
                "name" => $name,
                "roll" => $roll,
                "class" => $class,
                "section" => $section,
                "photo" => $photo_path ? $photo_path : "No Photo Uploaded"
            ]
        ];
    } else {
        $response['message'] = "Database insert failed: " . $conn->error;
    }
} else {
    $response['message'] = "Invalid Request Method. Only POST allowed.";
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
