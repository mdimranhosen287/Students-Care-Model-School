<?php
/**
 * get_banner.php
 * Fetches settings and slider list
 */

require_once 'db.php';

$response = [
    "status" => "success",
    "settings" => null,
    "slider" => null
];

// Fetch settings
$settings_res = $conn->query("SELECT * FROM `settings` LIMIT 1");
if ($settings_res && $settings_res->num_rows > 0) {
    $settings = $settings_res->fetch_assoc();
    // Normalize types
    $settings['bannerFontSize'] = intval($settings['bannerFontSize']);
    $settings['bannerGradient'] = (bool)$settings['bannerGradient'];
    $response['settings'] = $settings;
} else {
    // Return hardcoded default if something fails
    $response['settings'] = [
        "siteNameBn" => "স্টুডেন্টস কেয়ার মডেল স্কুল",
        "siteNameEn" => "Students Care Model School",
        "addressBn" => "কর্ণফুলী, চট্টগ্রাম",
        "addressEn" => "Karnafuli, Chattogram",
        "eiin" => "134256",
        "foundedYear" => "২০১৫",
        "helpline" => "01812-345678",
        "email" => "info@studentscaremodel.edu.bd",
        "website" => "www.studentscaremodel.edu.bd",
        "bannerColor" => "#025644",
        "bannerFontSize" => 32,
        "bannerGradient" => true,
        "logoUrl" => ""
    ];
}

// Fetch slider
$slider_res = $conn->query("SELECT * FROM `slider` ORDER BY `id` ASC");
if ($slider_res && $slider_res->num_rows > 0) {
    $slider_items = [];
    while ($row = $slider_res->fetch_assoc()) {
        $slider_items[] = $row;
    }
    $response['slider'] = $slider_items;
} else {
    $response['slider'] = null;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
