<?php
/**
 * process_login.php
 * Securely handles role-based login using prepared statements
 */

require_once 'db.php';

// Handle both JSON (from React) and POST (from form)
$contentType = $_SERVER["CONTENT_TYPE"] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $input = json_decode(file_get_contents("php://input"), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? '';
    $isJson = true;
} else {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? '';
    $isJson = false;
}

if (empty($username) || empty($password) || empty($role)) {
    if ($isJson) {
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["success" => false, "message" => "All fields are required"]);
    } else {
        echo "All fields are required";
    }
    exit();
}

// Prepare and execute query
$stmt = $conn->prepare("SELECT id, name, password FROM users WHERE username = ? AND role = ?");
$stmt->bind_param("ss", $username, $role);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    // Verify password hash
    if (password_verify($password, $user['password'])) {
        if ($isJson) {
            header("Content-Type: application/json; charset=UTF-8");
            echo json_encode([
                "success" => true, 
                "message" => "Login successful",
                "user" => [
                    "id" => $user['id'],
                    "name" => $user['name'],
                    "role" => $role
                ]
            ]);
        } else {
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $role;
            // Redirect to dashboard (assuming it exists)
            header("Location: dashboard.php");
            exit();
        }
    } else {
        if ($isJson) {
            header("Content-Type: application/json; charset=UTF-8");
            echo json_encode(["success" => false, "message" => "Invalid username or password"]);
        } else {
            echo "Invalid username or password";
        }
    }
} else {
    if ($isJson) {
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["success" => false, "message" => "Invalid user or role"]);
    } else {
        echo "Invalid user or role";
    }
}

$stmt->close();
$conn->close();
