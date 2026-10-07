import csv
from django.http import HttpResponse
from django.db.models import Count, Avg, Q, F
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile, Department, Course, Student, Enrollment, Attendance, Mark, Notification
from .serializers import (
    UserSerializer, UserProfileSerializer, DepartmentSerializer, CourseSerializer,
    StudentSerializer, EnrollmentSerializer, AttendanceSerializer, MarkSerializer,
    NotificationSerializer
)
from .permissions import IsTeacherOrAdmin, IsAdminUser, IsAdminOrTeacherOrReadOnlyStudent


# AUTHENTICATION APIS

@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Please provide both username and password.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    serializer = UserSerializer(user)

    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_api(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    # Force self-registration role to STUDENT
    role = 'STUDENT'

    if not username or not password or not email:
        return Response({'error': 'Username, email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name
    )

    UserProfile.objects.create(user=user, role=role)
    refresh = RefreshToken.for_user(user)
    serializer = UserSerializer(user)

    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': serializer.data
    }, status=status.HTTP_201_CREATED)


# DOMAIN VIEWSETS WITH STRICT TEACHER & STUDENT SCOPING

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().prefetch_related('students', 'courses')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnlyStudent]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name', 'created_at']


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnlyStudent]
    filterset_fields = ['department', 'semester', 'is_active', 'teacher']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name', 'credits', 'semester']

    def get_queryset(self):
        user = self.request.user
        qs = Course.objects.all().select_related('department', 'teacher').prefetch_related('enrollments')

        if not user.is_authenticated:
            return Course.objects.none()

        if user.is_superuser:
            return qs

        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

        if role == 'ADMIN':
            return qs
        elif role == 'TEACHER':
            # Teachers only see courses assigned to them
            return qs.filter(teacher=user)
        elif role == 'STUDENT':
            # Students only see courses they are enrolled in
            student = Student.objects.filter(user=user).first()
            if student:
                enrolled_course_ids = Enrollment.objects.filter(student=student).values_list('course_id', flat=True)
                return qs.filter(id__in=enrolled_course_ids)
            return Course.objects.none()

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'
        if role == 'TEACHER' and not user.is_superuser:
            serializer.save(teacher=user)
        else:
            serializer.save()


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnlyStudent]
    filterset_fields = ['department', 'status', 'gender', 'current_semester']
    search_fields = ['roll_number', 'name', 'first_name', 'last_name', 'email', 'mobile_number']
    ordering_fields = ['roll_number', 'name', 'created_at', 'current_semester']

    def get_queryset(self):
        user = self.request.user
        qs = Student.objects.all().select_related('department', 'user').prefetch_related('attendances', 'marks')

        if not user.is_authenticated:
            return Student.objects.none()

        if user.is_superuser:
            return qs

        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

        if role == 'ADMIN':
            return qs
        elif role == 'TEACHER':
            # Teachers can only access students enrolled in courses taught by this teacher
            teacher_course_ids = Course.objects.filter(teacher=user).values_list('id', flat=True)
            student_ids = Enrollment.objects.filter(course_id__in=teacher_course_ids).values_list('student_id', flat=True)
            return qs.filter(id__in=student_ids).distinct()
        elif role == 'STUDENT':
            return qs.filter(user=user)

        return qs

    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        student = self.get_object()
        user = request.user
        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

        if role == 'STUDENT' and not user.is_superuser:
            if student.user != user:
                return Response({'detail': 'You do not have permission to view this student profile.'}, status=status.HTTP_403_FORBIDDEN)

        if role == 'TEACHER' and not user.is_superuser:
            teacher_course_ids = Course.objects.filter(teacher=user).values_list('id', flat=True)
            is_enrolled = Enrollment.objects.filter(student=student, course_id__in=teacher_course_ids).exists()
            if not is_enrolled:
                return Response({'detail': 'You do not have permission to view a student not enrolled in your courses.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = StudentSerializer(student)
        enrollments = EnrollmentSerializer(student.enrollments.all(), many=True).data
        attendances = AttendanceSerializer(student.attendances.all()[:15], many=True).data
        marks = MarkSerializer(student.marks.all(), many=True).data

        return Response({
            'student': serializer.data,
            'enrollments': enrollments,
            'recent_attendance': attendances,
            'marks': marks,
            'attendance_percentage': student.attendance_percentage,
            'gpa': student.gpa
        })


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnlyStudent]
    filterset_fields = ['student', 'course', 'academic_year', 'semester', 'status']
    search_fields = ['student__name', 'student__roll_number', 'course__code', 'course__name']
    ordering_fields = ['enrolled_date', 'academic_year']

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.all().select_related('student', 'course')

        if not user.is_authenticated:
            return Enrollment.objects.none()

        if user.is_superuser:
            return qs

        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

        if role == 'ADMIN':
            return qs
        elif role == 'TEACHER':
            return qs.filter(course__teacher=user)
        elif role == 'STUDENT':
            return qs.filter(student__user=user)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        course = serializer.validated_data.get('course')
        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

        if role == 'TEACHER' and not user.is_superuser:
            if course.teacher != user:
                raise PermissionDenied("You can only enroll students in courses assigned to you.")

        serializer.save()


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnlyStudent]
    filterset_fields = ['student', 'course', 'date', 'status']
    search_fields = ['student__name', 'student__roll_number', 'course__code']
    ordering_fields = ['date', 'status']

    def get_queryset(self):
        user = self.request.user
        qs = Attendance.objects.all().select_related('student', 'course')

        if not user.is_authenticated:
            return Attendance.objects.none()

        if user.is_superuser:
            return qs

        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

        if role == 'ADMIN':
            return qs
        elif role == 'TEACHER':
            return qs.filter(course__teacher=user)
        elif role == 'STUDENT':
            return qs.filter(student__user=user)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        course = serializer.validated_data.get('course')
        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

        if role == 'TEACHER' and not user.is_superuser:
            if course.teacher != user:
                raise PermissionDenied("You can only record attendance for courses assigned to you.")

        serializer.save()

    @action(detail=False, methods=['post'], permission_classes=[IsTeacherOrAdmin])
    def batch_mark(self, request):
        user = request.user
        course_id = request.data.get('course')
        date_str = request.data.get('date')
        records = request.data.get('records', [])

        if not course_id or not date_str or not records:
            return Response({'error': 'course, date, and records list are required.'}, status=status.HTTP_400_BAD_REQUEST)

        course = Course.objects.filter(id=course_id).first()
        if not course:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'
        if role == 'TEACHER' and not user.is_superuser:
            if course.teacher != user:
                return Response({'detail': 'You can only mark attendance for courses assigned to you.'}, status=status.HTTP_403_FORBIDDEN)

        created_count = 0
        updated_count = 0

        for rec in records:
            student_id = rec.get('student')
            status_val = rec.get('status', 'Present')
            remarks = rec.get('remarks', '')

            obj, created = Attendance.objects.update_or_create(
                student_id=student_id,
                course_id=course_id,
                date=date_str,
                defaults={'status': status_val, 'remarks': remarks}
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response({
            'message': f'Successfully processed attendance. {created_count} created, {updated_count} updated.',
            'created': created_count,
            'updated': updated_count
        })

    @action(detail=False, methods=['get'])
    def report(self, request):
        user = request.user
        student_id = request.query_params.get('student')
        course_id = request.query_params.get('course')

        qs = Attendance.objects.all()

        if user.is_authenticated and not user.is_superuser:
            role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'
            if role == 'TEACHER':
                qs = qs.filter(course__teacher=user)
            elif role == 'STUDENT':
                qs = qs.filter(student__user=user)

        if student_id:
            qs = qs.filter(student_id=student_id)
        if course_id:
            qs = qs.filter(course_id=course_id)

        total = qs.count()
        present = qs.filter(status='Present').count()
        absent = qs.filter(status='Absent').count()
        late = qs.filter(status='Late').count()
        excused = qs.filter(status='Excused').count()
        percentage = round(((present + late) / total * 100), 1) if total > 0 else 100.0

        return Response({
            'total_sessions': total,
            'present': present,
            'absent': absent,
            'late': late,
            'excused': excused,
            'percentage': percentage
        })


class MarkViewSet(viewsets.ModelViewSet):
    serializer_class = MarkSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnlyStudent]
    filterset_fields = ['student', 'course', 'exam_type', 'grade']
    search_fields = ['student__name', 'student__roll_number', 'course__code', 'course__name']
    ordering_fields = ['created_at', 'marks_obtained']

    def get_queryset(self):
        user = self.request.user
        qs = Mark.objects.all().select_related('student', 'course')

        if not user.is_authenticated:
            return Mark.objects.none()

        if user.is_superuser:
            return qs

        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

        if role == 'ADMIN':
            return qs
        elif role == 'TEACHER':
            return qs.filter(course__teacher=user)
        elif role == 'STUDENT':
            return qs.filter(student__user=user)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        course = serializer.validated_data.get('course')
        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

        if role == 'TEACHER' and not user.is_superuser:
            if course.teacher != user:
                raise PermissionDenied("You can only record exam marks for courses assigned to you.")

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

        if role == 'TEACHER' and not user.is_superuser:
            if instance.course.teacher != user:
                raise PermissionDenied("You can only modify exam marks for courses assigned to you.")

        serializer.save()

    @action(detail=False, methods=['get'])
    def transcript(self, request):
        student_id = request.query_params.get('student')
        user = request.user

        if not student_id:
            return Response({'error': 'student parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        student = Student.objects.filter(id=student_id).first()
        if not student:
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'
        if role == 'STUDENT' and not user.is_superuser:
            if student.user != user:
                return Response({'detail': 'You do not have permission to access another student transcript.'}, status=status.HTTP_403_FORBIDDEN)

        if role == 'TEACHER' and not user.is_superuser:
            teacher_courses = Course.objects.filter(teacher=user)
            if not Enrollment.objects.filter(student=student, course__in=teacher_courses).exists():
                return Response({'detail': 'You do not have permission to view transcripts for students outside your classes.'}, status=status.HTTP_403_FORBIDDEN)
            marks = Mark.objects.filter(student=student, course__in=teacher_courses).select_related('course')
        else:
            marks = Mark.objects.filter(student=student).select_related('course')

        serializer = MarkSerializer(marks, many=True)
        gpa = student.gpa

        return Response({
            'student_id': student_id,
            'student_name': student.name,
            'roll_number': student.roll_number,
            'marks': serializer.data,
            'gpa': gpa
        })


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(Q(user=user) | Q(user__isnull=True))

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        user = self.request.user
        Notification.objects.filter(Q(user=user) | Q(user__isnull=True)).update(is_read=True)
        return Response({'status': 'all marked as read'})


# ROLE-SPECIFIC DASHBOARD STATS API

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

    # Student Dashboard
    if role == 'STUDENT' and not user.is_superuser:
        student = Student.objects.filter(user=user).first()
        if not student:
            return Response({
                'is_student': True,
                'student_name': user.username,
                'attendance_percentage': 100.0,
                'gpa': 0.0,
                'enrolled_courses_count': 0,
                'recent_marks': [],
                'recent_attendance': []
            })

        enrollments = Enrollment.objects.filter(student=student).select_related('course')
        marks = Mark.objects.filter(student=student).select_related('course')[:5]
        recent_attendance = Attendance.objects.filter(student=student).select_related('course')[:5]

        return Response({
            'is_student': True,
            'student': StudentSerializer(student).data,
            'attendance_percentage': student.attendance_percentage,
            'gpa': student.gpa,
            'enrolled_courses_count': enrollments.count(),
            'recent_marks': MarkSerializer(marks, many=True).data,
            'recent_attendance': AttendanceSerializer(recent_attendance, many=True).data,
            'enrolled_courses': EnrollmentSerializer(enrollments, many=True).data
        })

    # Teacher Class-Appropriate Stats
    if role == 'TEACHER' and not user.is_superuser:
        teacher_courses = Course.objects.filter(teacher=user)
        teacher_course_ids = teacher_courses.values_list('id', flat=True)
        teacher_students = Student.objects.filter(enrollments__course_id__in=teacher_course_ids).distinct()
        teacher_attendances = Attendance.objects.filter(course_id__in=teacher_course_ids)
        teacher_marks = Mark.objects.filter(course_id__in=teacher_course_ids)

        total_att = teacher_attendances.count()
        present_att = teacher_attendances.filter(status__in=['Present', 'Late']).count()
        overall_attendance = round((present_att / total_att * 100), 1) if total_att > 0 else 100.0

        students_with_gpa = [s.gpa for s in teacher_students if s.marks.filter(course_id__in=teacher_course_ids).exists()]
        avg_gpa = round(sum(students_with_gpa) / len(students_with_gpa), 2) if students_with_gpa else 3.5

        dept_counts = list(Department.objects.filter(courses__teacher=user).annotate(count=Count('students')).values('name', 'code'))
        grade_counts = list(teacher_marks.values('grade').annotate(count=Count('id')).order_by('grade'))

        return Response({
            'is_student': False,
            'is_teacher': True,
            'total_students': teacher_students.count(),
            'active_students': teacher_students.filter(status='Active').count(),
            'total_courses': teacher_courses.count(),
            'total_departments': len(dept_counts),
            'overall_attendance': overall_attendance,
            'avg_gpa': avg_gpa,
            'department_distribution': dept_counts,
            'grade_distribution': grade_counts,
            'recent_enrollments': EnrollmentSerializer(Enrollment.objects.filter(course_id__in=teacher_course_ids)[:5], many=True).data,
            'recent_marks': MarkSerializer(teacher_marks[:5], many=True).data,
            'recent_students': StudentSerializer(teacher_students[:5], many=True).data
        })

    # Admin Institutional Analytics
    total_students = Student.objects.count()
    active_students = Student.objects.filter(status='Active').count()
    total_courses = Course.objects.count()
    total_departments = Department.objects.count()

    total_att = Attendance.objects.count()
    present_att = Attendance.objects.filter(status__in=['Present', 'Late']).count()
    overall_attendance = round((present_att / total_att * 100), 1) if total_att > 0 else 94.5

    students_with_gpa = [s.gpa for s in Student.objects.all() if s.marks.exists()]
    avg_gpa = round(sum(students_with_gpa) / len(students_with_gpa), 2) if students_with_gpa else 3.45

    gender_counts = list(Student.objects.values('gender').annotate(count=Count('id')))
    dept_counts = list(Department.objects.values('name', 'code').annotate(count=Count('students')))
    grade_counts = list(Mark.objects.values('grade').annotate(count=Count('id')).order_by('grade'))

    recent_enrollments = EnrollmentSerializer(Enrollment.objects.all()[:5], many=True).data
    recent_marks = MarkSerializer(Mark.objects.all()[:5], many=True).data
    recent_students = StudentSerializer(Student.objects.all()[:5], many=True).data

    return Response({
        'is_student': False,
        'is_teacher': False,
        'total_students': total_students,
        'active_students': active_students,
        'total_courses': total_courses,
        'total_departments': total_departments,
        'overall_attendance': overall_attendance,
        'avg_gpa': avg_gpa,
        'gender_distribution': gender_counts,
        'department_distribution': dept_counts,
        'grade_distribution': grade_counts,
        'recent_enrollments': recent_enrollments,
        'recent_marks': recent_marks,
        'recent_students': recent_students
    })


# SECURE CLASS-APPROPRIATE CSV REPORT EXPORTS

@api_view(['GET'])
@permission_classes([IsTeacherOrAdmin])
def export_students_csv(request):
    user = request.user
    role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="students_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['Roll Number', 'Name', 'Email', 'Mobile', 'Gender', 'Department', 'Semester', 'Status', 'GPA', 'Attendance %'])

    if role == 'TEACHER' and not user.is_superuser:
        teacher_course_ids = Course.objects.filter(teacher=user).values_list('id', flat=True)
        students = Student.objects.filter(enrollments__course_id__in=teacher_course_ids).distinct().select_related('department')
    else:
        students = Student.objects.all().select_related('department')

    for s in students:
        writer.writerow([
            s.roll_number, s.name, s.email, s.mobile_number, s.gender,
            s.department.name if s.department else s.course,
            s.current_semester, s.status, s.gpa, f"{s.attendance_percentage}%"
        ])

    return response


@api_view(['GET'])
@permission_classes([IsTeacherOrAdmin])
def export_attendance_csv(request):
    user = request.user
    role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="attendance_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['Date', 'Roll Number', 'Student Name', 'Course Code', 'Course Name', 'Status', 'Remarks'])

    if role == 'TEACHER' and not user.is_superuser:
        attendances = Attendance.objects.filter(course__teacher=user).select_related('student', 'course')
    else:
        attendances = Attendance.objects.all().select_related('student', 'course')

    for a in attendances:
        writer.writerow([
            a.date, a.student.roll_number, a.student.name,
            a.course.code, a.course.name, a.status, a.remarks
        ])

    return response


@api_view(['GET'])
@permission_classes([IsTeacherOrAdmin])
def export_marks_csv(request):
    user = request.user
    role = getattr(user.profile, 'role', 'STUDENT') if hasattr(user, 'profile') else 'STUDENT'

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="academic_marks_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['Roll Number', 'Student Name', 'Course Code', 'Exam Type', 'Marks Obtained', 'Max Marks', 'Grade', 'Remarks'])

    if role == 'TEACHER' and not user.is_superuser:
        marks = Mark.objects.filter(course__teacher=user).select_related('student', 'course')
    else:
        marks = Mark.objects.all().select_related('student', 'course')

    for m in marks:
        writer.writerow([
            m.student.roll_number, m.student.name, m.course.code,
            m.exam_type, m.marks_obtained, m.max_marks, m.grade, m.remarks
        ])

    return response
