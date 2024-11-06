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
function checkAuth($teacher_id, $user_id)
{
    if (isset($teacher_id) && isset($user_id) && !is_null($teacher_id) && !is_null($user_id))
        http_response_code(200);
    else {
        http_response_code(200);
        exit;
    }
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
function getJournal($teacher_id, $subject_id, $group_id, $type)
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
        if ($type == 'grades') {
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
        } else {
            $stmt = $conn->prepare("select a.FIO as student, a.student_id, b.journal_id,b.class_type,b.status, b.remark, b.class_id, b.subject_id, b.date from (select FIO, id as student_id from students
            where students.group_id = ?) as a
            left join (select j.id as journal_id, j.student_id ,c.type as class_type, status, class_id, c.subject_id, c.date, j.remark from attendance_journal j
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
                    'status' => $row['status'],
                    'remark' => $row['remark'],
                ];
            }
        }
        $response['journal'] = $journal;
        $response['success'] = true;
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    echo json_encode($response);
}


function getGroupsForSubject($teacher_id, $subject)
{
    $conn = getDbConnection();
    $response = ['success' => false];
    try {
        $stmt = $conn->prepare('select g.id from `groups` g join subject_groups sg on sg.group_id = g.id join subjects s on sg.subject_id = s.id where s.name = ? and teacher_id = ?');
        $stmt->bind_param('si', $subject, $teacher_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $groups = array();
        while ($row = $result->fetch_assoc()) {
            $groups[] = [
                'group' => $row['id'],
            ];
        }
        $response['groups'] = $groups;
        $response['success'] = true;
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    echo json_encode($response);
}

function getAvg($group_id, $subject, $type)
{
    $conn = getDbConnection();
    $response = ['success' => false];
    try {
        if ($type == 'group') {
            $stmt = $conn->prepare('select s.group_id, AVG(j.grade) AS avg from students s join grades_journal j on s.id = j.student_id join classes c on j.class_id = c.id join subjects su on c.subject_id = su.id
            where su.name = ? group by s.group_id');
            $stmt->bind_param('s', $subject);
        } elseif ($type == 'student') {
            $stmt = $conn->prepare('select FIO, COALESCE(avg(j.grade),0) as avg from students s left join grades_journal j on s.id = j.student_id left join classes c on j.class_id = c.id left join subjects su on c.subject_id = su.id
            where s.group_id = ? and (su.name = ? or c.subject_id IS NULL) group by FIO ');
            $stmt->bind_param('ss', $group_id, $subject);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $avg = array();
        while ($row = $result->fetch_assoc()) {
            $avg[] = [
                "$type" => ($type == 'group' ? $row['group_id']: $row['FIO']),
                'avg' => $row['avg']
            ];
        }
        $response['avg'] = $avg;
        $response['success'] = true;
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
    elseif ($get_action == 'checkAuth') checkAuth($data['teacher_id'], $data['user_id']);
    elseif ($get_action == 'getGroupsForSubject') getGroupsForSubject($data['teacher_id'], $data['subject']);
    elseif ($get_action == 'getAvg') getAvg($data['group_id'], $data['subject'], $data['type']);
    elseif ($get_action == 'getSubjectGroups') {
        if (isset($data['teacher_id']) && isset($data['subject_id']))
            getSubjectGroups($data['teacher_id'], $data['subject_id']);
        else return http_response_code(403);
    } elseif ($get_action == 'getJournal') if (isset($data['teacher_id']) && isset($data['type'])) getJournal($data['teacher_id'], $data['subject_id'], $data['group_id'], $data['type']);
}
