<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>School Portal Login</title>
    <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f5f5; font-family: sans-serif; }
        .login-container { background: #fff; padding: 40px; borderRadius: 4px; boxShadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; maxWidth: 400px; }
        h2 { textAlign: center; marginBottom: 24px; color: #1b5e20; }
        .role-tabs { display: flex; marginBottom: 16px; gap: 5px; }
        .role-tab { flex: 1; padding: 10px; border: 1px solid #ccc; cursor: pointer; text-align: center; }
        .role-tab.active { background: #1b5e20; color: #fff; border-color: #1b5e20; }
        input { width: 100%; padding: 10px; marginBottom: 16px; border: 1px solid #ccc; borderRadius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #1b5e20; color: #fff; border: none; borderRadius: 4px; fontWeight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <div class="login-container">
        <h2>School Portal Login</h2>
        <div class="role-tabs">
            <div class="role-tab active" onclick="setRole('admin', this)">Admin</div>
            <div class="role-tab" onclick="setRole('teacher', this)">Teacher</div>
            <div class="role-tab" onclick="setRole('guardian', this)">Guardian</div>
            <div class="role-tab" onclick="setRole('accountant', this)">Accountant</div>
        </div>
        <form action="process_login.php" method="POST">
            <input type="hidden" name="role" id="selected_role" value="admin">
            <input type="text" name="username" placeholder="USERNAME" required>
            <input type="password" name="password" placeholder="PASSWORD" required>
            <button type="submit">Sign in</button>
        </form>
    </div>
    <script>
        function setRole(role, element) {
            document.getElementById('selected_role').value = role;
            document.querySelectorAll('.role-tab').forEach(tab => tab.classList.remove('active'));
            element.classList.add('active');
        }
    </script>
</body>
</html>
