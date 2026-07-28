<?php
/**
 * save_banner.php
 * Saves site banner settings and handles logo image upload
 */

require_once 'db.php';

$response = [
    "status" => "error",
    "message" => "An unknown save error occurred"
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Collect settings data
    $siteNameBn = isset($_POST['siteNameBn']) ? $conn->real_escape_string(trim($_POST['siteNameBn'])) : '';
    $siteNameEn = isset($_POST['siteNameEn']) ? $conn->real_escape_string(trim($_POST['siteNameEn'])) : '';
    $addressBn = isset($_POST['addressBn']) ? $conn->real_escape_string(trim($_POST['addressBn'])) : '';
    $addressEn = isset($_POST['addressEn']) ? $conn->real_escape_string(trim($_POST['addressEn'])) : '';
    $eiin = isset($_POST['eiin']) ? $conn->real_escape_string(trim($_POST['eiin'])) : '';
    $foundedYear = isset($_POST['foundedYear']) ? $conn->real_escape_string(trim($_POST['foundedYear'])) : '';
    $helpline = isset($_POST['helpline']) ? $conn->real_escape_string(trim($_POST['helpline'])) : '';
    $email = isset($_POST['email']) ? $conn->real_escape_string(trim($_POST['email'])) : '';
    $website = isset($_POST['website']) ? $conn->real_escape_string(trim($_POST['website'])) : '';
    $bannerColor = isset($_POST['bannerColor']) ? $conn->real_escape_string(trim($_POST['bannerColor'])) : '';
    $bannerFontSize = isset($_POST['bannerFontSize']) ? intval($_POST['bannerFontSize']) : 32;
    $bannerGradient = (isset($_POST['bannerGradient']) && ($_POST['bannerGradient'] === 'true' || $_POST['bannerGradient'] === '1')) ? 1 : 0;

    // Handle logo file upload if present
    $logo_path = '';
    $update_logo_clause = "";
    if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
        $uploads_dir = 'uploads';
        if (!is_dir($uploads_dir)) {
            mkdir($uploads_dir, 0777, true);
        }

        $file_name = $_FILES['logo']['name'];
        $file_tmp = $_FILES['logo']['tmp_name'];
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

        $allowed_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'ico'];
        if (in_array($file_ext, $allowed_exts)) {
            $unique_name = 'logo_' . time() . '.' . $file_ext;
            $dest_file = $uploads_dir . '/' . $unique_name;
            if (move_uploaded_file($file_tmp, $dest_file)) {
                $logo_path = 'php_backend/' . $dest_file;
                $update_logo_clause = ", `logoUrl` = '$logo_path'";
            }
        }
    }

    // Prepare fields to update
    $fields = [];
    if (!empty($siteNameBn)) $fields[] = "`siteNameBn` = '$siteNameBn'";
    if (!empty($siteNameEn)) $fields[] = "`siteNameEn` = '$siteNameEn'";
    if (!empty($addressBn)) $fields[] = "`addressBn` = '$addressBn'";
    if (!empty($addressEn)) $fields[] = "`addressEn` = '$addressEn'";
    if (!empty($eiin)) $fields[] = "`eiin` = '$eiin'";
    if (!empty($foundedYear)) $fields[] = "`foundedYear` = '$foundedYear'";
    if (!empty($helpline)) $fields[] = "`helpline` = '$helpline'";
    if (!empty($email)) $fields[] = "`email` = '$email'";
    if (!empty($website)) $fields[] = "`website` = '$website'";
    if (!empty($bannerColor)) $fields[] = "`bannerColor` = '$bannerColor'";
    if ($bannerFontSize > 0) $fields[] = "`bannerFontSize` = $bannerFontSize";
    $fields[] = "`bannerGradient` = $bannerGradient";

    $update_sql = implode(", ", $fields);
    if (!empty($update_logo_clause)) {
        $update_sql .= $update_logo_clause;
    }

    if (!empty($update_sql)) {
        $update_res = $conn->query("UPDATE `settings` SET $update_sql LIMIT 1");
        if ($update_res) {
            $response = [
                "status" => "success",
                "message" => "Settings and banner parameters saved successfully!"
            ];
        } else {
            $response['message'] = "Failed to update settings database: " . $conn->error;
        }
    } else {
        $response['message'] = "No settings fields to update.";
    }
} else {
    $response['message'] = "Invalid Request Method. POST required.";
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
