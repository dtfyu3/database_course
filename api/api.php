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
    $conn->close();
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
    $conn->close();
    echo json_encode($response);
}
function getJournal($teacher_id, $subject_id, $group_id, $type)
{
    $conn = getDbConnection();
    $response = ['success' => false];
    try {
        $stmt = $conn->prepare("select date from classes left join subjects s on s.id = classes.subject_id where classes.subject_id = ? and s.teacher_id = ? and classes.group_id = ? order by date ");
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
            $studentsData = [];
            while ($row = $result->fetch_assoc()) {
                $stud_name = $row['student'];
                if (!isset($studentsData[$stud_name])) {
                    $studentsData[$stud_name] = [
                        'student' => $row['student'],
                        'grades' => []
                    ];
                }
                $studentsData[$stud_name]['grades'][] = [
                    'date' => $row['date'],
                    'class' => $row['class_id'],
                    'class_type' => $row['class_type'],
                    'grade' => $row['grade'],
                    'subject_id' => $row['subject_id'],
                    'grade_type' => $row['grade_type']
                ];
                $response['students'] = $studentsData;
            }
        } else {
            $stmt = $conn->prepare("select a.FIO as student, a.student_id, b.journal_id,b.class_type,b.status, b.remark, b.class_id, b.subject_id, b.date from (select FIO, id as student_id from students
            where students.group_id = ?) as a
            left join (select j.id as journal_id, j.student_id ,c.type as class_type, status, class_id, c.subject_id, c.date, j.remark from attendance_journal j
            left join classes c on j.class_id = c.id left join subjects s on c.subject_id = s.id where s.id = ? and s.teacher_id = ?) as b on a.student_id = b.student_id order by student");
            $stmt->bind_param('sii', $group_id, $subject_id, $teacher_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $studentsData = [];
            while ($row = $result->fetch_assoc()) {
                $stud_name = $row['student'];
                if (!isset($studentsData[$stud_name])) {
                    $studentsData[$stud_name] = [
                        'student' => $row['student'],
                    ];
                }
                $studentsData[$stud_name]['attendance'][] = [
                    'date' => $row['date'],
                    'class' => $row['class_id'],
                    'class_type' => $row['class_type'],
                    'status' => $row['status'],
                    'remark' => $row['remark'],
                ];
            }
        }
        $response['students'] = $studentsData;
        $response['success'] = true;
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    $conn->close();
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
    $conn->close();
    echo json_encode($response);
}

function getAvg($group_id, $subject, $type, $begin_date = null, $end_date = null)
{
    $conn = getDbConnection();
    $response = ['success' => false];
    // echo($begin_date);
    try {
        if ($type == 'group') {
            if (is_null($begin_date) && is_null($end_date)) {
                $stmt = $conn->prepare('select s.group_id, AVG(j.grade) AS avg from students s join grades_journal j on s.id = j.student_id join classes c on j.class_id = c.id join subjects su on c.subject_id = su.id
                where su.name = ? group by s.group_id');
                $stmt->bind_param('s', $subject);
            } else {
                $stmt = $conn->prepare("SELECT s.group_id, DATE_FORMAT(c.date, '%Y-%m') AS month, AVG(gj.grade) AS avg FROM grades_journal gj JOIN students s ON gj.student_id = s.id JOIN classes c ON gj.class_id = c.id 
                WHERE c.date BETWEEN ? AND ? GROUP BY s.group_id,DATE_FORMAT(c.date, '%Y-%m')ORDER BY month;");
                $stmt->bind_param('ss', $begin_date, $end_date);
            }
        } elseif ($type == 'student') {
            if (!is_null($begin_date) && !is_null($end_date)) {
                $stmt = $conn->prepare("SELECT s.FIO, DATE_FORMAT(c.date, '%Y-%m') AS month, COALESCE(AVG(j.grade), 0) AS avg FROM students s LEFT JOIN grades_journal j ON s.id = j.student_id LEFT JOIN classes c ON j.class_id = c.id
                LEFT JOIN subjects su ON c.subject_id = su.id WHERE s.group_id = ? AND su.name = ? AND c.date BETWEEN ? AND ? GROUP BY s.FIO, DATE_FORMAT(c.date, '%Y-%m') ORDER BY s.FIO, month;");
                $stmt->bind_param('ssss', $group_id, $subject, $begin_date, $end_date);
            } else {
                $stmt = $conn->prepare('select FIO, COALESCE(avg(j.grade),0) as avg from students s left join grades_journal j on s.id = j.student_id left join classes c on j.class_id = c.id left join subjects su on c.subject_id = su.id
                where s.group_id = ? and (su.name = ? or c.subject_id IS NULL) group by FIO ');
                $stmt->bind_param('ss', $group_id, $subject);
            }
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $avg = array();
        if (!is_null($begin_date) && !is_null($end_date)) {
            while ($row = $result->fetch_assoc()) {
                $avg[] = [
                    'month' => $row['month'],
                    ($type == 'group' ? 'group' : 'FIO') => ($type == 'group' ? $row['group_id'] : $row['FIO']),
                    'avg' => $row['avg']
                ];
            }
        } else {
            while ($row = $result->fetch_assoc()) {
                $avg[] = [
                    "$type" => ($type == 'group' ? $row['group_id'] : $row['FIO']),
                    'avg' => $row['avg']
                ];
            }
        }
        $response['avg'] = $avg;
        $response['success'] = true;
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    $conn->close();
    echo json_encode($response);
}

function updateRecord($student, $subject_id, $date, $type, $value, $remark)
{
    $conn = getDbConnection();
    $response = ['success' => false];
    $conn->begin_transaction();
    try {
        if ($type == 'grades') {
            $stmt = $conn->prepare('select j.id from grades_journal j join students s on j.student_id = s.id join classes c on j.class_id = c.id where s.FIO = ? and c.date = ? and c.subject_id = ?');
            $stmt->bind_param('ssi', $student, $date, $subject_id);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_column();
            if ($result != null) {
                if ($value == '-') {
                    $sql = "delete from $type";
                    $sql = $sql . '_journal where id = ?';
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param('i', $result);
                    $stmt->execute();
                } else {
                    $sql = "update $type";
                    $sql = $sql . '_journal set grade = ? where id = ?';
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param('ii', $value, $result);
                    $stmt->execute();
                }
            } else {
                $stmt = $conn->prepare('select c.id from classes c where c.date = ? and c.subject_id = ?');
                $stmt->bind_param('si', $date, $subject_id);
                $stmt->execute();
                $class_id = $stmt->get_result()->fetch_column();
                $stmt = $conn->prepare('select s.id from students s where s.FIO = ?');
                $stmt->bind_param('s', $student);
                $stmt->execute();
                $student_id = $stmt->get_result()->fetch_column();
                $stmt = $conn->prepare('insert into grades_journal (type, grade, class_id, student_id) values ("",?,?,?)');
                $stmt->bind_param('iii', $value, $class_id, $student_id);
                $stmt->execute();
            }
        }
    } catch (Exception $e) {
        $conn->rollback();
        $response['error'] = $e->getMessage();
    }
    $response['success'] = true;
    $conn->commit();
    $conn->close();
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
    elseif ($get_action == 'getAvg') getAvg($data['group_id'], $data['subject'], $data['type'], $data['begin_date'], $data['end_date']);
    elseif ($get_action == 'updateRecord') updateRecord($data['student'], $data['subject_id'], $data['date'], $data['type'], $data['value'], isset($data['remark']) ? $data['remark'] : null);
    elseif ($get_action == 'getSubjectGroups') {
        if (isset($data['teacher_id']) && isset($data['subject_id']))
            getSubjectGroups($data['teacher_id'], $data['subject_id']);
        else return http_response_code(403);
    } elseif ($get_action == 'getJournal') if (isset($data['teacher_id']) && isset($data['type'])) getJournal($data['teacher_id'], $data['subject_id'], $data['group_id'], $data['type']);

    else echo ('Invalid action');
}
