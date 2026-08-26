<?php
/**
 * update_student.php
 * Update student information by student_id or id
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

$json_raw = file_get_contents('php://input');
$data = json_decode($json_raw, true) ?: $_POST;

$student_id = trim($data['student_id'] ?? '');
$id = intval($data['id'] ?? 0);

if (empty($student_id) && $id <= 0) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["status" => "error", "message" => "Student ID or Record ID is required for update."]);
    exit();
}

$updatable_fields = [
    'name', 'name_bn', 'roll', 'class_name', 'section', 'shift', 'group_name',
    'gender', 'blood_group', 'dob', 'religion', 'father_name', 'father_occupation',
    'mother_name', 'mother_occupation', 'guardian_name', 'guardian_phone', 'guardian_relation',
    'present_address', 'permanent_address', 'photo_url', 'session_year', 'monthly_fee',
    'payment_status', 'due_amount', 'status'
];

$set_clauses = [];
$params = [];
$types = "";

foreach ($updatable_fields as $field) {
    if (isset($data[$field])) {
        $set_clauses[] = "`$field` = ?";
        $params[] = $data[$field];
        $types .= "s";
    }
}

if (empty($set_clauses)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["status" => "error", "message" => "No fields provided to update."]);
    exit();
}

$where_clause = "";
if (!empty($student_id)) {
    $where_clause = "`student_id` = ?";
    $params[] = $student_id;
    $types .= "s";
} else {
    $where_clause = "`id` = ?";
    $params[] = $id;
    $types .= "i";
}

$sql = "UPDATE `students` SET " . implode(", ", $set_clauses) . " WHERE $where_clause";
$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param($types, ...$params);
    if ($stmt->execute()) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            "status" => "success",
            "message" => "Student information updated successfully!",
            "affected_rows" => $stmt->affected_rows
        ]);
    } else {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(["status" => "error", "message" => "Update failed: " . $stmt->error]);
    }
    $stmt->close();
} else {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
}

$conn->close();
?>
