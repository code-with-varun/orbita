<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$dbPath = __DIR__ . '/orbita.db';

try {
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (Exception $e) {
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'dashboard_stats':
        getDashboardStats($pdo);
        break;
    case 'tasks':
        getTasks($pdo);
        break;
    case 'users':
        getUsers($pdo);
        break;
    case 'workspaces':
        getWorkspaces($pdo);
        break;
    case 'hierarchy':
        getHierarchy($pdo);
        break;
    case 'login':
        handleLogin($pdo);
        break;
    default:
        echo json_encode(["message" => "Orbita PHP REST API Server is active", "db_connected" => true]);
        break;
}

function getDashboardStats($pdo) {
    $today = date('Y-m-d');
    
    $totalTasks = $pdo->query("SELECT COUNT(*) as cnt FROM tasks")->fetch()['cnt'];
    $completedTasks = $pdo->query("SELECT COUNT(*) as cnt FROM tasks WHERE status IN ('Completed', 'Closed')")->fetch()['cnt'];
    $dueToday = $pdo->query("SELECT COUNT(*) as cnt FROM tasks WHERE due_date = '$today'")->fetch()['cnt'];
    $overdue = $pdo->query("SELECT COUNT(*) as cnt FROM tasks WHERE due_date < '$today' AND status NOT IN ('Completed', 'Closed')")->fetch()['cnt'];
    $runningTimers = $pdo->query("SELECT COUNT(*) as cnt FROM tasks WHERE is_timer_running = 1")->fetch()['cnt'];
    $hoursRow = $pdo->query("SELECT SUM(actual_hours) as total FROM tasks")->fetch();
    $totalHours = round($hoursRow['total'] ? $hoursRow['total'] : 0, 1);
    
    $statusDist = $pdo->query("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")->fetchAll();
    $workspaceStats = $pdo->query("
        SELECT w.name, w.color, COUNT(t.id) as task_count, SUM(t.actual_hours) as total_hours
        FROM workspaces w
        LEFT JOIN projects p ON p.workspace_id = w.id
        LEFT JOIN processes pr ON pr.project_id = p.id
        LEFT JOIN tasks t ON t.process_id = pr.id
        GROUP BY w.id
    ")->fetchAll();

    echo json_encode([
        "total_tasks" => (int)$totalTasks,
        "completed_tasks" => (int)$completedTasks,
        "due_today" => (int)$dueToday,
        "overdue" => (int)$overdue,
        "running_timers" => (int)$runningTimers,
        "total_hours_logged" => $totalHours,
        "completion_rate" => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0,
        "status_distribution" => $statusDist,
        "workspace_stats" => $workspaceStats
    ]);
}

function getTasks($pdo) {
    $stmt = $pdo->query("
        SELECT t.*, pr.name as process_name, p.name as project_name, w.name as workspace_name, w.color as workspace_color,
               (SELECT COUNT(*) FROM steps WHERE task_id = t.id) as step_count,
               (SELECT COUNT(*) FROM steps WHERE task_id = t.id AND is_completed = 1) as completed_step_count
        FROM tasks t
        JOIN processes pr ON t.process_id = pr.id
        JOIN projects p ON pr.project_id = p.id
        JOIN workspaces w ON p.workspace_id = w.id
        ORDER BY t.id DESC
    ");
    echo json_encode($stmt->fetchAll());
}

function getUsers($pdo) {
    $stmt = $pdo->query("SELECT id, name, email, role FROM users ORDER BY name ASC");
    echo json_encode($stmt->fetchAll());
}

function getWorkspaces($pdo) {
    $stmt = $pdo->query("SELECT * FROM workspaces ORDER BY id ASC");
    echo json_encode($stmt->fetchAll());
}

function getHierarchy($pdo) {
    $workspaces = $pdo->query("SELECT * FROM workspaces")->fetchAll();
    $projects = $pdo->query("SELECT * FROM projects")->fetchAll();
    $processes = $pdo->query("SELECT * FROM processes")->fetchAll();

    $tree = array_map(function($w) use ($projects, $processes) {
        $w['projects'] = array_map(function($p) use ($processes) {
            $p['processes'] = array_filter($processes, function($pr) use ($p) {
                return $pr['project_id'] == $p['id'];
            });
            return $p;
        }, array_filter($projects, function($p) use ($w) {
            return $p['workspace_id'] == $w['id'];
        }));
        return $w;
    }, $workspaces);

    echo json_encode(array_values($tree));
}

function handleLogin($pdo) {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
    $password = isset($data['password']) ? trim($data['password']) : '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && $user['password_hash'] === $password) {
        echo json_encode([
            "message" => "Login successful",
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "role" => $user['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Invalid email or password"]);
    }
}
?>
