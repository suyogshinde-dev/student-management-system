from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        TEACHER = "TEACHER", "Teacher / Staff"
        STUDENT = "STUDENT", "Student"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Department(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "Department"
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="courses")
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="taught_courses")
    credits = models.IntegerField(default=3)
    semester = models.IntegerField(default=1)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "Course"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Student(models.Model):
    class Gender(models.TextChoices):
        MALE = "Male", "Male"
        FEMALE = "Female", "Female"
        OTHER = "Other", "Other"

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"
        GRADUATED = "Graduated", "Graduated"
        SUSPENDED = "Suspended", "Suspended"

    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="student_profile")
    name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=50, blank=True, default='')
    last_name = models.CharField(max_length=50, blank=True, default='')
    roll_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    mobile_number = models.CharField(max_length=15)
    gender = models.CharField(max_length=15, choices=Gender.choices)
    date_of_birth = models.DateField()
    course = models.CharField(max_length=150, blank=True, default='')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="students")
    current_semester = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    address = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "Student"
        ordering = ["roll_number"]

    def save(self, *args, **kwargs):
        if not self.name and (self.first_name or self.last_name):
            self.name = f"{self.first_name} {self.last_name}".strip()
        elif self.name and not self.first_name:
            parts = self.name.split(" ", 1)
            self.first_name = parts[0]
            self.last_name = parts[1] if len(parts) > 1 else ""
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.roll_number} - {self.name}"

    @property
    def attendance_percentage(self):
        total = self.attendances.count()
        if total == 0:
            return 100.0
        present_count = self.attendances.filter(status__in=["Present", "Late"]).count()
        return round((present_count / total) * 100, 1)

    @property
    def gpa(self):
        marks = self.marks.all()
        if not marks:
            return 0.0
        total_percentage = sum((float(m.marks_obtained) / float(m.max_marks)) * 100 for m in marks if float(m.max_marks) > 0)
        avg_percentage = total_percentage / len(marks)
        gpa_val = (avg_percentage / 100.0) * 4.0
        return round(gpa_val, 2)


class Enrollment(models.Model):
    class Status(models.TextChoices):
        ENROLLED = "Enrolled", "Enrolled"
        COMPLETED = "Completed", "Completed"
        DROPPED = "Dropped", "Dropped"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    academic_year = models.CharField(max_length=15, default="2025-2026")
    semester = models.IntegerField(default=1)
    enrolled_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ENROLLED)

    class Meta:
        db_table = "Enrollment"
        unique_together = ["student", "course", "academic_year", "semester"]
        ordering = ["-enrolled_date"]

    def __str__(self):
        return f"{self.student.name} enrolled in {self.course.code}"


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "Present", "Present"
        ABSENT = "Absent", "Absent"
        LATE = "Late", "Late"
        EXCUSED = "Excused", "Excused"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendances")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="attendances")
    date = models.DateField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PRESENT)
    remarks = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        db_table = "Attendance"
        unique_together = ["student", "course", "date"]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.student.roll_number} - {self.course.code} - {self.date} ({self.status})"


class Mark(models.Model):
    class ExamType(models.TextChoices):
        MIDTERM = "Midterm", "Midterm Examination"
        FINAL = "Final", "Final Examination"
        QUIZ = "Quiz", "Quiz / Test"
        ASSIGNMENT = "Assignment", "Assignment / Project"
        LAB = "Lab", "Practical / Lab"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="marks")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="marks")
    exam_type = models.CharField(max_length=30, choices=ExamType.choices, default=ExamType.FINAL)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2)
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    grade = models.CharField(max_length=5, blank=True, default='')
    remarks = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "Mark"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if float(self.max_marks) > 0:
            percentage = (float(self.marks_obtained) / float(self.max_marks)) * 100
            if percentage >= 90:
                self.grade = "A+"
            elif percentage >= 80:
                self.grade = "A"
            elif percentage >= 70:
                self.grade = "B"
            elif percentage >= 60:
                self.grade = "C"
            elif percentage >= 50:
                self.grade = "D"
            else:
                self.grade = "F"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.roll_number} - {self.course.code} ({self.exam_type}): {self.marks_obtained}/{self.max_marks}"


class Notification(models.Model):
    class Category(models.TextChoices):
        ACADEMIC = "Academic", "Academic"
        ATTENDANCE = "Attendance", "Attendance"
        SYSTEM = "System", "System"
        GENERAL = "General", "General"

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.GENERAL)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "Notification"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d')}"