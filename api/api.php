<?php
function getDbConnection()
{
    $servername = "localhost";
    $username = "root";
    $password = "1q2w3e4r5t6y0";
    $dbname = "bd";
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    return $conn;
}

function getSubjects($user_id)
{
    $conn = getDbConnection();
    $response = ['success' => false];
    try {
        $stmt = $conn->prepare('select teacher_id from users_teachers where user_id = ?');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result =  $stmt->get_result()->fetch_assoc()['teacher_id'];
        $response['teacher_id'] = $result;
        if (!is_null($result)) {
            $stmt = $conn->prepare('select * from subjects where teacher_id = ?');
            $stmt->bind_param('i', $result);
            $stmt->execute();
            $result = $stmt->get_result();
            $subjects = array();
            while ($row = $result->fetch_assoc()) {
                $subjects[] = [
                    'id' => $row['id'],
                    'name' => $row['name']
                ];
            }
            $response['success'] = true;
        }
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    $response['subjects'] = $subjects;
    echo json_encode($response);
}

function getSubjectGroups($teacher_id, $subject_id)
{
    $conn = getDbConnection();
    $response = ['success' => false];
    try {
        $stmt = $conn->prepare('select group_id from subject_groups left join subjects on subject_groups.subject_id = subjects.id where subjects.teacher_id = ? and subject_groups.subject_id = ?');
        $stmt->bind_param('ii', $teacher_id, $subject_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $groups = array();
        while ($row = $result->fetch_assoc()) {
            $groups[] = [
                'group' => $row['group_id']
            ];
        }
        $response['success'] = true;
        $response['groups'] = $groups;
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    echo json_encode($response);
}
function getGradesJournal($teacher_id, $subject_id, $group_id)
{
    $conn = getDbConnection();
    $response = ['success' => false];
    try {
        $stmt = $conn->prepare("select date from classes left join subjects s on s.id = classes.subject_id where classes.subject_id = ? and s.teacher_id = ? and classes.group_id = ? ");
        $stmt->bind_param('iis', $subject_id, $teacher_id, $group_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $classes = array();
        while ($row = $result->fetch_assoc()) {
            $classes[] = [
                'date' => $row['date']
            ];
        }
        $response['classes'] = $classes;
        $stmt = $conn->prepare("select a.FIO as student, a.student_id, b.journal_id,b.class_type, b.grade, b.class_id, b.subject_id, b.date, b.grade_type from (select FIO, id as student_id from students
where students.group_id = ?) as a
left join (select j.id as journal_id, j.student_id ,c.type as class_type, grade, class_id, c.subject_id, c.date, j.type as grade_type from grades_journal j
left join classes c on j.class_id = c.id left join subjects s on c.subject_id = s.id where s.id = ? and s.teacher_id = ?) as b on a.student_id = b.student_id order by student");
        $stmt->bind_param('sii', $group_id, $subject_id, $teacher_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $journal = array();
        while ($row = $result->fetch_assoc()) {
            $journal[] = [
                'date' => $row['date'],
                'class' => $row['class_id'],
                'class_type' => $row['class_type'],
                'student_id' => $row['student_id'],
                'student' => $row['student'],
                'grade' => $row['grade'],
                'grade_type' => $row['grade_type'],
            ];
        }
        $response['journal'] = $journal;
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    echo json_encode($response);
}

$data = json_decode(file_get_contents('php://input'), true);
$action = null;
$get_action = null;
if (isset($_GET['get_action'])) $get_action = $_GET['get_action'];
if ($get_action != null) {
    if ($get_action == 'getSubjects') getSubjects($data['user_id']);
    elseif ($get_action == 'getSubjectGroups') getSubjectGroups($data['teacher_id'], $data['subject_id']);
    elseif ($get_action == 'getGradesJournal') getGradesJournal($data['teacher_id'], $data['subject_id'], $data['group_id']);
}
