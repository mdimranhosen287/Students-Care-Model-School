<?php
/**
 * get_students.php
 * Fetch list of students with filter/search queries from MySQL database
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

$class_filter = isset($_GET['class']) ? $conn->real_escape_string(trim($_GET['class'])) : '';
$section_filter = isset($_GET['section']) ? $conn->real_escape_string(trim($_GET['section'])) : '';
$search_filter = isset($_GET['search']) ? $conn->real_escape_string(trim($_GET['search'])) : '';

$where_clauses = [];

// Check columns
$col_query = "SHOW COLUMNS FROM `students`";
$col_res = $conn->query($col_query);
$existing_cols = [];
if ($col_res) {
    while ($r = $col_res->fetch_assoc()) {
        $existing_cols[] = $r['Field'];
    }
}

$class_col = in_array('class_name', $existing_cols) ? 'class_name' : (in_array('class', $existing_cols) ? 'class' : '');
$roll_col = in_array('roll', $existing_cols) ? 'roll' : (in_array('roll_no', $existing_cols) ? 'roll_no' : '');
$name_col = in_array('name', $existing_cols) ? 'name' : (in_array('full_name', $existing_cols) ? 'full_name' : '');
$phone_col = in_array('guardian_phone', $existing_cols) ? 'guardian_phone' : (in_array('phone_number', $existing_cols) ? 'phone_number' : (in_array('phone', $existing_cols) ? 'phone' : ''));

if ($class_filter !== '' && $class_filter !== 'All' && $class_col !== '') {
    $where_clauses[] = "`$class_col` = '$class_filter'";
}
if ($section_filter !== '' && $section_filter !== 'All' && in_array('section', $existing_cols)) {
    $where_clauses[] = "`section` = '$section_filter'";
}
if ($search_filter !== '') {
    $search_sub = [];
    if ($name_col) $search_sub[] = "`$name_col` LIKE '%$search_filter%'";
    if ($roll_col) $search_sub[] = "`$roll_col` LIKE '%$search_filter%'";
    if ($phone_col) $search_sub[] = "`$phone_col` LIKE '%$search_filter%'";
    if (in_array('student_id', $existing_cols)) $search_sub[] = "`student_id` LIKE '%$search_filter%'";
    if (!empty($search_sub)) {
        $where_clauses[] = "(" . implode(" OR ", $search_sub) . ")";
    }
}

$where_sql = "";
if (count($where_clauses) > 0) {
    $where_sql = "WHERE " . implode(" AND ", $where_clauses);
}

$order_by = "ORDER BY `id` DESC";
if ($class_col && $roll_col) {
    $order_by = "ORDER BY `$class_col` ASC, CAST(`$roll_col` AS UNSIGNED) ASC, `id` DESC";
}

$query = "SELECT * FROM `students` $where_sql $order_by";
$res = $conn->query($query);

$students = [];
if ($res && $res->num_rows > 0) {
    while ($row = $res->fetch_assoc()) {
        $row['id'] = intval($row['id']);
        $row['sl'] = intval($row['id']);
        $row['name'] = $row['name'] ?? $row['full_name'] ?? '';
        $row['full_name'] = $row['name'];
        $row['roll'] = $row['roll'] ?? $row['roll_no'] ?? '';
        $row['roll_no'] = $row['roll'];
        $row['class'] = $row['class_name'] ?? $row['class'] ?? '';
        $row['class_name'] = $row['class'];
        $row['guardian'] = $row['guardian_name'] ?? $row['guardian'] ?? ($row['father_name'] ?? '');
        $row['guardian_name'] = $row['guardian'];
        $row['phone'] = $row['guardian_phone'] ?? $row['phone_number'] ?? ($row['phone'] ?? '');
        $row['phone_number'] = $row['phone'];
        $row['address'] = $row['present_address'] ?? ($row['address'] ?? '');
        $row['photo'] = $row['photo_url'] ?? ($row['photo'] ?? ($row['image'] ?? ''));
        $students[] = $row;
    }
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    "status" => "success",
    "count" => count($students),
    "students" => $students
], JSON_UNESCAPED_UNICODE);

$conn->close();
?>
