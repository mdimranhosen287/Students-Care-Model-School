<?php
/**
 * save_slider.php
 * Saves homepage slider parameters in bulk
 */

require_once 'db.php';

$response = [
    "status" => "error",
    "message" => "An unknown slider save error occurred"
];

$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if slider is set inside input
    $slider_data = null;
    if (isset($input['slider'])) {
        $slider_data = $input['slider'];
    } else if (isset($_POST['slider'])) {
        $slider_data = json_decode($_POST['slider'], true);
    } else if (is_array($input)) {
        $slider_data = $input;
    }

    if (is_array($slider_data)) {
        // Clear old sliders first
        $conn->query("TRUNCATE TABLE `slider`");

        $stmt = $conn->prepare("INSERT INTO `slider` (`image`, `titleBn`, `titleEn`, `subtitleBn`, `subtitleEn`) VALUES (?, ?, ?, ?, ?)");
        
        $success = true;
        foreach ($slider_data as $item) {
            $image = isset($item['image']) ? trim($item['image']) : '';
            $titleBn = isset($item['titleBn']) ? trim($item['titleBn']) : '';
            $titleEn = isset($item['titleEn']) ? trim($item['titleEn']) : '';
            $subtitleBn = isset($item['subtitleBn']) ? trim($item['subtitleBn']) : '';
            $subtitleEn = isset($item['subtitleEn']) ? trim($item['subtitleEn']) : '';

            if (!empty($image)) {
                $stmt->bind_param("sssss", $image, $titleBn, $titleEn, $subtitleBn, $subtitleEn);
                if (!$stmt->execute()) {
                    $success = false;
                }
            }
        }
        $stmt->close();

        if ($success) {
            $response = [
                "status" => "success",
                "message" => "Slider parameters saved successfully!"
            ];
        } else {
            $response['message'] = "Some slider items failed to save in the database: " . $conn->error;
        }
    } else {
        $response['message'] = "Validation failed: slider payload must be an array of objects.";
    }
} else {
    $response['message'] = "Invalid Request Method. POST required.";
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
