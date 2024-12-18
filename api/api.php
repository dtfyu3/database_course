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
            $stmt = $conn->prepare('select s.id, s.name, sg.group_id from subjects s left join subject_groups sg on s.id = sg.subject_id where teacher_id = ?');
            $stmt->bind_param('i', $result);
            $stmt->execute();
            $result = $stmt->get_result();
            $subjects = array();
            while ($row = $result->fetch_assoc()) {
                $subject = $row['name'];
                if (!isset($subjects[$subject])) {
                    $subjects[$subject] = [
                        'id' => $row['id'],
                        'name' => $row['name'],
                    ];
                }
                if (!is_null($row['group_id'])) {
                    $subjects[$subject]['groups'][] = [
                        $row['group_id']
                    ];
                } else $subjects[$subject]['groups'] = null;
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

function getSubjectGroups($teacher_id, $subject_id, $subject = null)
{
    $conn = getDbConnection();
    $response = ['success' => false];
    try {
        if (is_null($subject)) {
            $stmt = $conn->prepare('select group_id as id from subject_groups left join subjects on subject_groups.subject_id = subjects.id where subjects.teacher_id = ? and subject_groups.subject_id = ?');
            $stmt->bind_param('ii', $teacher_id, $subject_id);
        } else {
            $stmt = $conn->prepare('select g.id from `groups` g join subject_groups sg on sg.group_id = g.id join subjects s on sg.subject_id = s.id where s.name = ? and teacher_id = ?');
            $stmt->bind_param('si', $subject, $teacher_id);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $groups = array();
        while ($row = $result->fetch_assoc()) {
            $groups[] = [
                'group' => $row['id'],
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
        $stmt = $conn->prepare("select classes.id, date, type from classes left join subjects s on s.id = classes.subject_id where classes.subject_id = ? and s.teacher_id = ? and classes.group_id = ? order by date ");
        $stmt->bind_param('iis', $subject_id, $teacher_id, $group_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $classes = array();
        while ($row = $result->fetch_assoc()) {
            $classes[] = [
                'id' => $row['id'],
                'date' => $row['date'],
                'type' => $row['type']
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


function getAvg($group_id, $subject, $type, $begin_date = null, $end_date = null)
{
    $conn = getDbConnection();
    $response = ['success' => false];
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
                where s.group_id = ? and (su.name = ? or c.subject_id IS NULL) group by FIO order by FIO');
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

function updateRecord($student, $subject_id, $date, $class_id, $type, $value, $remark)
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
        } elseif ($type == 'attendance') {
            $value = $value == 'present' ? 'Присутствует' : 'Отсутствует';
            $stmt = $conn->prepare('select j.id from attendance_journal j join students s on j.student_id = s.id join classes c on j.class_id = c.id where s.FIO = ? and c.date = ? and c.subject_id = ?');
            $stmt->bind_param('ssi', $student, $date, $subject_id);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_column();
            if ($result != null) {
                $sql = "update $type";
                $sql = $sql . '_journal set status = ?, remark = ? where id = ?';
                $stmt = $conn->prepare($sql);
                $stmt->bind_param('ssi', $value, $remark, $result);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare('select c.id from classes c where c.date = ? and c.subject_id = ?');
                $stmt->bind_param('si', $date, $subject_id);
                $stmt->execute();
                $class_id = $stmt->get_result()->fetch_column();
                $stmt = $conn->prepare('select s.id from students s where s.FIO = ?');
                $stmt->bind_param('s', $student);
                $stmt->execute();
                $student_id = $stmt->get_result()->fetch_column();
                $stmt = $conn->prepare('insert into attendance_journal (class_id, student_id, status, remark) values (?,?,?,?)');
                $stmt->bind_param('iiss', $class_id, $student_id, $value, $remark);
                $stmt->execute();
            }
        } elseif ($type == 'class') {
            $stmt = $conn->prepare('update classes set type = ? where date = ? and subject_id = ? and id = ?');
            $stmt->bind_param('ssii', $value, $date, $subject_id, $class_id);
            $stmt->execute();
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
function getAttReport($subject)
{
    $conn = getDbConnection();
    $response['success'] = false;
    try {
        $stmt = $conn->prepare("SELECT DATE_FORMAT(c.date, '%Y-%m') as month, COUNT(DISTINCT s.id) as total_students, SUM(CASE WHEN j.status = 'Присутствует' THEN 1 ELSE 0 END) as present, COUNT(DISTINCT s.id) - SUM(CASE WHEN j.status = 'Присутствует' THEN 1 ELSE 0 END) as absent
    FROM students s JOIN classes c ON c.subject_id = (select id from subjects where name = ?) LEFT JOIN attendance_journal j ON s.id = j.student_id AND c.id = j.class_id WHERE c.date IS NOT NULL GROUP BY month ORDER BY month;");
        $stmt->bind_param('s', $subject);
        $stmt->execute();
        $result = $stmt->get_result();
        $att = array();
        while ($row = $result->fetch_assoc()) {
            $att[] = [
                'month' => $row['month'],
                'present' => $row['present'],
                'absent' => $row['absent']
            ];
        }
        $response['att'] = $att;
        $response['success'] = true;
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    echo json_encode($response);
}
function getSessionsResults()
{
    $conn = getDbConnection();
    $response['success'] = false;
    try {
        $stmt = $conn->prepare("select s.id, date, su.name as subject, type, t.FIO as teacher, st.FIO as student, mark from sessions_results s JOIN subjects su on s.subject_id = su.id
        join teachers t on s.teacher_id = t.id join students st on s.student_id = st.id order by date, student");
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $sessions[] = [
                'date' => $row['date'],
                'subject' => $row['subject'],
                'type' => $row['type'],
                'teacher' => $row['teacher'],
                'student' => $row['student'],
                'mark' => $row['mark']
            ];
        }
        $response['sessions'] = $sessions;
        $response['success'] = true;
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    $conn->close();
    echo json_encode($response);
}

function executeRawSQL($query)
{
    $conn = getDbConnection();
    $query = trim($query);
    try {
        $forbiddenKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER'];
        foreach ($forbiddenKeywords as $keyword) {
            if (stripos($query, $keyword) !== false) {
                echo json_encode(['error' => "Ошибка: Нельзя выполнять запросы типа '$keyword'"]);
                exit;
            }
        }
        $result = $conn->query($query);
        if ($result === false) {
            echo json_encode(['error' => 'Ошибка выполнения запроса: ' . $conn->error]);
        } else {
            $rows = [];
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }
            echo json_encode(['results' => $rows]);
        }
    } catch (Exception $e) {
        $response['error'] = $e->getMessage();
    }
    $conn->close();
}

$data = json_decode(file_get_contents('php://input'), true);
$action = null;
$get_action = null;
if (isset($_GET['get_action'])) $get_action = $_GET['get_action'];
if ($get_action != null) {
    if ($get_action == 'getSubjects') getSubjects($data['user_id']);
    elseif ($get_action == 'getAvg') getAvg($data['group_id'], $data['subject'], $data['type'], $data['begin_date'], $data['end_date']);
    elseif ($get_action == 'updateRecord') updateRecord($data['student'], $data['subject_id'], $data['date'], isset($data['class_id']) ? $data['class_id'] : null, $data['type'], $data['value'], isset($data['remark']) ? $data['remark'] : null);
    elseif ($get_action == 'getSessionsResults') getSessionsResults();
    elseif ($get_action == 'executeRawSQL') executeRawSQL($data['query']);
    elseif ($get_action == 'getAttReport') getAttReport($data['subject']);
    elseif ($get_action == 'getSubjectGroups') {
        getSubjectGroups($data['teacher_id'], isset($data['subject_id']) ? $data['subject_id'] : null, isset($data['subject']) ? $data['subject'] : null);
    } elseif ($get_action == 'getJournal') if (isset($data['teacher_id']) && isset($data['type'])) getJournal($data['teacher_id'], $data['subject_id'], $data['group_id'], $data['type']);

    else echo ('Invalid action');
}
