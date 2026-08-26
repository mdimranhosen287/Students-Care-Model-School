<?php
/**
 * insert.php
 * Handles student registration and data insertion to MySQL Database
 * Supports JSON payloads and multipart/form-data with photo upload
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

$response = [
    "status" => "error",
    "message" => "An unknown error occurred"
];

// 1. Read input data (JSON or Form POST)
$input_data = [];
$content_type = isset($_SERVER['CONTENT_TYPE']) ? trim($_SERVER['CONTENT_TYPE']) : '';

if (strpos($content_type, 'application/json') !== false) {
    $json_raw = file_get_contents('php://input');
    $input_data = json_decode($json_raw, true) ?: [];
} else {
    $input_data = $_POST;
}

// 2. Extract values with fallbacks
$name = trim($input_data['name'] ?? $input_data['full_name'] ?? $input_data['student_name'] ?? $_POST['name'] ?? $_POST['full_name'] ?? '');
$name_bn = trim($input_data['name_bn'] ?? $input_data['full_name_bn'] ?? $_POST['name_bn'] ?? '');
$roll = trim($input_data['roll'] ?? $input_data['roll_no'] ?? $_POST['roll'] ?? $_POST['roll_no'] ?? '');
$class = trim($input_data['class'] ?? $input_data['class_name'] ?? $_POST['class'] ?? $_POST['class_name'] ?? '');
$section = trim($input_data['section'] ?? $_POST['section'] ?? 'A');
$shift = trim($input_data['shift'] ?? $_POST['shift'] ?? 'Morning');
$gender = trim($input_data['gender'] ?? $_POST['gender'] ?? 'Male');
$blood_group = trim($input_data['blood_group'] ?? $_POST['blood_group'] ?? '');
$dob = trim($input_data['dob'] ?? $input_data['date_of_birth'] ?? $_POST['dob'] ?? $_POST['date_of_birth'] ?? '');
$religion = trim($input_data['religion'] ?? $_POST['religion'] ?? 'Islam');

// Guardian / Parents
$father_name = trim($input_data['father_name'] ?? $_POST['father_name'] ?? '');
$mother_name = trim($input_data['mother_name'] ?? $_POST['mother_name'] ?? '');
$guardian = trim($input_data['guardian_name'] ?? $input_data['guardian'] ?? $_POST['guardian_name'] ?? $_POST['guardian'] ?? ($father_name ?: 'Guardian'));
$phone = trim($input_data['guardian_phone'] ?? $input_data['phone'] ?? $input_data['phone_number'] ?? $input_data['mobile_number'] ?? $_POST['phone'] ?? $_POST['phone_number'] ?? '');
$relation = trim($input_data['guardian_relation'] ?? $_POST['guardian_relation'] ?? 'Father');

// Address
$present_address = trim($input_data['present_address'] ?? $input_data['address'] ?? $_POST['present_address'] ?? $_POST['address'] ?? '');
$permanent_address = trim($input_data['permanent_address'] ?? $_POST['permanent_address'] ?? $present_address);

// Session & ID
$session_year = trim($input_data['session_year'] ?? $input_data['session'] ?? $_POST['session_year'] ?? date('Y'));
$student_id = trim($input_data['student_id'] ?? $_POST['student_id'] ?? ('STD-' . $session_year . '-' . rand(1000, 9999)));

// Photo handling
$photo_url = trim($input_data['photo'] ?? $input_data['photo_url'] ?? $input_data['image'] ?? $_POST['photo'] ?? '');

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
            $photo_url = $dest_file;
        }
    }
}

// 3. Validation
if (empty($name) || empty($class) || empty($phone)) {
    $response['message'] = "Validation Failed: Student Name, Class, and Phone number are required.";
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

// 4. Inspect table columns to guarantee dynamic compatibility
$col_query = "SHOW COLUMNS FROM `students`";
$col_res = $conn->query($col_query);

if (!$col_res) {
    $response['message'] = "Error checking table: " . $conn->error . ". Please make sure the 'students' table is created.";
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

$existing_cols = [];
while ($r = $col_res->fetch_assoc()) {
    $existing_cols[] = $r['Field'];
}

// 5. Build dynamic field map based on whatever columns exist in the database
$data_map = [];

// Name column
if (in_array('name', $existing_cols)) $data_map['name'] = $name;
if (in_array('full_name', $existing_cols)) $data_map['full_name'] = $name;
if (in_array('name_bn', $existing_cols)) $data_map['name_bn'] = $name_bn;

// Roll column
if (in_array('roll', $existing_cols)) $data_map['roll'] = $roll;
if (in_array('roll_no', $existing_cols)) $data_map['roll_no'] = $roll;

// Class column
if (in_array('class_name', $existing_cols)) $data_map['class_name'] = $class;
if (in_array('class', $existing_cols)) $data_map['class'] = $class;

// Section column
if (in_array('section', $existing_cols)) $data_map['section'] = $section;

// Student ID
if (in_array('student_id', $existing_cols)) $data_map['student_id'] = $student_id;

// Gender, Shift, Blood Group, DOB, Religion
if (in_array('gender', $existing_cols)) $data_map['gender'] = $gender;
if (in_array('shift', $existing_cols)) $data_map['shift'] = $shift;
if (in_array('blood_group', $existing_cols)) $data_map['blood_group'] = $blood_group;
if (in_array('dob', $existing_cols) && !empty($dob)) $data_map['dob'] = $dob;
if (in_array('date_of_birth', $existing_cols) && !empty($dob)) $data_map['date_of_birth'] = $dob;
if (in_array('religion', $existing_cols)) $data_map['religion'] = $religion;

// Parents & Guardian
if (in_array('father_name', $existing_cols)) $data_map['father_name'] = $father_name;
if (in_array('mother_name', $existing_cols)) $data_map['mother_name'] = $mother_name;
if (in_array('guardian_name', $existing_cols)) $data_map['guardian_name'] = $guardian;
if (in_array('guardian', $existing_cols)) $data_map['guardian'] = $guardian;
if (in_array('guardian_phone', $existing_cols)) $data_map['guardian_phone'] = $phone;
if (in_array('phone_number', $existing_cols)) $data_map['phone_number'] = $phone;
if (in_array('phone', $existing_cols)) $data_map['phone'] = $phone;
if (in_array('guardian_relation', $existing_cols)) $data_map['guardian_relation'] = $relation;

// Address
if (in_array('present_address', $existing_cols)) $data_map['present_address'] = $present_address;
if (in_array('permanent_address', $existing_cols)) $data_map['permanent_address'] = $permanent_address;
if (in_array('address', $existing_cols)) $data_map['address'] = $present_address;

// Photo & Session
if (in_array('photo_url', $existing_cols)) $data_map['photo_url'] = $photo_url;
if (in_array('photo', $existing_cols)) $data_map['photo'] = $photo_url;
if (in_array('image', $existing_cols)) $data_map['image'] = $photo_url;
if (in_array('session_year', $existing_cols)) $data_map['session_year'] = $session_year;
if (in_array('status', $existing_cols)) $data_map['status'] = 'Active';

if (empty($data_map)) {
    $response['message'] = "No matching columns found in 'students' table.";
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

$fields = [];
$values = [];
foreach ($data_map as $col => $val) {
    $fields[] = "`" . $conn->real_escape_string($col) . "`";
    $values[] = "'" . $conn->real_escape_string($val) . "'";
}

$insert_sql = "INSERT INTO `students` (" . implode(", ", $fields) . ") VALUES (" . implode(", ", $values) . ")";

if ($conn->query($insert_sql)) {
    $last_id = $conn->insert_id;
    $response = [
        "status" => "success",
        "message" => "Student data successfully saved to database!",
        "id" => $last_id,
        "student_id" => $student_id,
        "data" => [
            "id" => $last_id,
            "student_id" => $student_id,
            "name" => $name,
            "roll" => $roll,
            "class" => $class,
            "section" => $section,
            "phone" => $phone,
            "photo" => $photo_url
        ]
    ];
} else {
    $response['message'] = "Database insert error: " . $conn->error;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
?>
