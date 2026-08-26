<?php
/**
 * delete_student.php
 * Delete a student record by student_id or id
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

$json_raw = file_get_contents('php://input');
$data = json_decode($json_raw, true) ?: $_POST;

$student_id = trim($data['student_id'] ?? $_GET['student_id'] ?? '');
$id = intval($data['id'] ?? $_GET['id'] ?? 0);

if (empty($student_id) && $id <= 0) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["status" => "error", "message" => "Student ID or Record ID is required."]);
    exit();
}

if (!empty($student_id)) {
    $stmt = $conn->prepare("DELETE FROM `students` WHERE `student_id` = ?");
    $stmt->bind_param("s", $student_id);
} else {
    $stmt = $conn->prepare("DELETE FROM `students` WHERE `id` = ?");
    $stmt->bind_param("i", $id);
}

if ($stmt && $stmt->execute()) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        "status" => "success",
        "message" => "Student record deleted successfully!",
        "deleted_count" => $stmt->affected_rows
    ]);
    $stmt->close();
} else {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["status" => "error", "message" => "Delete failed: " . ($stmt ? $stmt->error : $conn->error)]);
}

$conn->close();
?>
