<?php
/**
 * get_students.php
 * Retrieve student records with filtering, searching, and pagination
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

$class_filter   = isset($_GET['class_name']) ? trim($_GET['class_name']) : (isset($_GET['class']) ? trim($_GET['class']) : '');
$section_filter = isset($_GET['section']) ? trim($_GET['section']) : '';
$session_filter = isset($_GET['session_year']) ? trim($_GET['session_year']) : '';
$search_query   = isset($_GET['search']) ? trim($_GET['search']) : '';
$student_id     = isset($_GET['student_id']) ? trim($_GET['student_id']) : '';

$where_clauses = [];
$params = [];
$types = "";

if (!empty($student_id)) {
    $where_clauses[] = "`student_id` = ?";
    $params[] = $student_id;
    $types .= "s";
}

if (!empty($class_filter) && $class_filter !== 'All') {
    $where_clauses[] = "(`class_name` = ? OR `class` = ?)";
    $params[] = $class_filter;
    $params[] = $class_filter;
    $types .= "ss";
}

if (!empty($section_filter) && $section_filter !== 'All') {
    $where_clauses[] = "`section` = ?";
    $params[] = $section_filter;
    $types .= "s";
}

if (!empty($session_filter) && $session_filter !== 'All') {
    $where_clauses[] = "`session_year` = ?";
    $params[] = $session_filter;
    $types .= "s";
}

if (!empty($search_query)) {
    $where_clauses[] = "(`name` LIKE ? OR `name_bn` LIKE ? OR `roll` LIKE ? OR `guardian_phone` LIKE ? OR `student_id` LIKE ?)";
    $like = "%" . $search_query . "%";
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $types .= "sssss";
}

$where_sql = "";
if (!empty($where_clauses)) {
    $where_sql = "WHERE " . implode(" AND ", $where_clauses);
}

$sql = "SELECT * FROM `students` $where_sql ORDER BY `id` DESC";
$stmt = $conn->prepare($sql);

if ($stmt) {
    if (!empty($types) && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }
    
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        "status" => "success",
        "total" => count($students),
        "data" => $students
    ], JSON_UNESCAPED_UNICODE);
    
    $stmt->close();
} else {
    // Fallback simple query
    $res = $conn->query("SELECT * FROM `students` ORDER BY `id` DESC");
    $students = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $students[] = $row;
        }
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        "status" => "success",
        "total" => count($students),
        "data" => $students
    ], JSON_UNESCAPED_UNICODE);
}

$conn->close();
?>
