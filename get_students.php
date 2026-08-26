<?php
/**
 * get_students.php
 * Fetch list of students with filter/search queries matching the students table schema
 */

require_once 'db.php';

$class_filter = isset($_GET['class']) ? $conn->real_escape_string(trim($_GET['class'])) : '';
$section_filter = isset($_GET['section']) ? $conn->real_escape_string(trim($_GET['section'])) : '';
$search_filter = isset($_GET['search']) ? $conn->real_escape_string(trim($_GET['search'])) : '';

$where_clauses = [];

if ($class_filter !== '' && $class_filter !== 'All') {
    $where_clauses[] = "`class` = '$class_filter'";
}
if ($section_filter !== '' && $section_filter !== 'All') {
    $where_clauses[] = "`section` = '$section_filter'";
}
if ($search_filter !== '') {
    $where_clauses[] = "(`full_name` LIKE '%$search_filter%' OR `roll_no` LIKE '%$search_filter%' OR `phone_number` LIKE '%$search_filter%' OR `student_id` LIKE '%$search_filter%')";
}

$where_sql = "";
if (count($where_clauses) > 0) {
    $where_sql = "WHERE " . implode(" AND ", $where_clauses);
}

$query = "SELECT * FROM `students` $where_sql ORDER BY `class` ASC, CAST(`roll_no` AS UNSIGNED) ASC, `id` DESC";
$res = $conn->query($query);

$students = [];
if ($res && $res->num_rows > 0) {
    while ($row = $res->fetch_assoc()) {
        $row['id'] = intval($row['id']);
        $row['sl'] = intval($row['id']);
        $row['name'] = isset($row['full_name']) ? $row['full_name'] : '';
        $row['roll'] = isset($row['roll_no']) ? $row['roll_no'] : '';
        $row['guardian'] = isset($row['guardian_name']) ? $row['guardian_name'] : '';
        $row['phone'] = isset($row['phone_number']) ? $row['phone_number'] : '';
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
