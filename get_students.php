<?php
/**
 * get_students.php
 * Fetch list of students with filter/search queries
 */

require_once 'db.php';

$class_filter = isset($_GET['class']) ? $conn->real_escape_string(trim($_GET['class'])) : '';
$section_filter = isset($_GET['section']) ? $conn->real_escape_string(trim($_GET['section'])) : '';
$search_filter = isset($_GET['search']) ? $conn->real_escape_string(trim($_GET['search'])) : '';

$where_clauses = [];

if ($class_filter !== '') {
    $where_clauses[] = "`class` = '$class_filter'";
}
if ($section_filter !== '') {
    $where_clauses[] = "`section` = '$section_filter'";
}
if ($search_filter !== '') {
    $where_clauses[] = "(`name` LIKE '%$search_filter%' OR `roll` LIKE '%$search_filter%' OR `phone` LIKE '%$search_filter%')";
}

$where_sql = "";
if (count($where_clauses) > 0) {
    $where_sql = "WHERE " . implode(" AND ", $where_clauses);
}

$query = "SELECT * FROM `students` $where_sql ORDER BY `class` ASC, CAST(`roll` AS UNSIGNED) ASC, `sl` ASC";
$res = $conn->query($query);

$students = [];
if ($res && $res->num_rows > 0) {
    while ($row = $res->fetch_assoc()) {
        $row['sl'] = intval($row['sl']);
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
