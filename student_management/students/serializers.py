from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Department, Course, Student, Enrollment, Attendance, Mark, Notification


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["id", "role", "phone", "address", "avatar"]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    role = serializers.SerializerMethodField()
    student_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "student_id", "profile"]

    def get_role(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.role
        if obj.is_superuser:
            return "ADMIN"
        return "STUDENT"

    def get_student_id(self, obj):
        if hasattr(obj, 'student_profile'):
            return obj.student_profile.id
        return None


class DepartmentSerializer(serializers.ModelSerializer):
    students_count = serializers.SerializerMethodField()
    courses_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ["id", "code", "name", "description", "created_at", "students_count", "courses_count"]

    def get_students_count(self, obj):
        return obj.students.count()

    def get_courses_count(self, obj):
        return obj.courses.count()


class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    department_code = serializers.CharField(source="department.code", read_only=True)
    teacher_name = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "code", "name", "department", "department_name", "department_code",
            "teacher", "teacher_name", "credits", "semester", "description", "is_active", "created_at", "enrolled_count"
        ]

    def get_teacher_name(self, obj):
        if obj.teacher:
            full_name = f"{obj.teacher.first_name} {obj.teacher.last_name}".strip()
            return full_name if full_name else obj.teacher.username
        return "Unassigned"

    def get_enrolled_count(self, obj):
        return obj.enrollments.filter(status="Enrolled").count()


class StudentSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    department_code = serializers.CharField(source="department.code", read_only=True)
    attendance_percentage = serializers.ReadOnlyField()
    gpa = serializers.ReadOnlyField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id", "user", "name", "first_name", "last_name", "full_name",
            "roll_number", "email", "mobile_number", "gender", "date_of_birth",
            "course", "department", "department_name", "department_code",
            "current_semester", "status", "address", "created_at",
            "attendance_percentage", "gpa"
        ]

    def get_full_name(self, obj):
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.name

    def validate_roll_number(self, value):
        instance = getattr(self, 'instance', None)
        if Student.objects.filter(roll_number=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("A student with this Roll Number already exists.")
        return value

    def validate_email(self, value):
        instance = getattr(self, 'instance', None)
        if Student.objects.filter(email=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("A student with this Email already exists.")
        return value


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_roll = serializers.CharField(source="student.roll_number", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id", "student", "student_name", "student_roll",
            "course", "course_name", "course_code",
            "academic_year", "semester", "enrolled_date", "status"
        ]


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_roll = serializers.CharField(source="student.roll_number", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id", "student", "student_name", "student_roll",
            "course", "course_name", "course_code",
            "date", "status", "remarks"
        ]


class MarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_roll = serializers.CharField(source="student.roll_number", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    grade = serializers.ReadOnlyField()

    class Meta:
        model = Mark
        fields = [
            "id", "student", "student_name", "student_roll",
            "course", "course_name", "course_code",
            "exam_type", "marks_obtained", "max_marks", "grade", "remarks", "created_at"
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "user", "title", "message", "category", "is_read", "created_at"]
