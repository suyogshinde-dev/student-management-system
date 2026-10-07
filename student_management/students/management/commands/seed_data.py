import datetime
import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from students.models import UserProfile, Department, Course, Student, Enrollment, Attendance, Mark, Notification

class Command(BaseCommand):
    help = 'Seeds initial realistic data for Student Management System with multi-teacher course assignments'

    def handle(self, *args, **options):
        self.stdout.write("Starting data seeding...")

        # 1. Admin & Teachers Setup
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@college.edu", "first_name": "System", "last_name": "Administrator", "is_staff": True, "is_superuser": True}
        )
        admin_user.set_password("admin123")
        admin_user.save()
        UserProfile.objects.get_or_create(user=admin_user, defaults={"role": UserProfile.Role.ADMIN, "phone": "9876543210"})

        teacher1_user, _ = User.objects.get_or_create(
            username="teacher",
            defaults={"email": "prof.smith@college.edu", "first_name": "Robert", "last_name": "Smith", "is_staff": True}
        )
        teacher1_user.set_password("teacher123")
        teacher1_user.save()
        UserProfile.objects.get_or_create(user=teacher1_user, defaults={"role": UserProfile.Role.TEACHER, "phone": "9876543211"})

        teacher2_user, _ = User.objects.get_or_create(
            username="teacher2",
            defaults={"email": "prof.davis@college.edu", "first_name": "Sarah", "last_name": "Davis", "is_staff": True}
        )
        teacher2_user.set_password("teacher123")
        teacher2_user.save()
        UserProfile.objects.get_or_create(user=teacher2_user, defaults={"role": UserProfile.Role.TEACHER, "phone": "9876543219"})

        student_user, _ = User.objects.get_or_create(
            username="student1",
            defaults={"email": "alex.johnson@student.college.edu", "first_name": "Alex", "last_name": "Johnson"}
        )
        student_user.set_password("student123")
        student_user.save()
        UserProfile.objects.get_or_create(user=student_user, defaults={"role": UserProfile.Role.STUDENT, "phone": "9876543212"})

        # 2. Departments
        departments_data = [
            {"code": "CS", "name": "Computer Science & Engineering", "description": "Focuses on software engineering, AI, algorithms, and computing systems."},
            {"code": "ECE", "name": "Electronics & Communication", "description": "Focuses on microelectronics, embedded systems, and telecommunications."},
            {"code": "ME", "name": "Mechanical Engineering", "description": "Design, analysis, and manufacturing of mechanical systems."},
            {"code": "CE", "name": "Civil Engineering", "description": "Infrastructure design, structural analysis, and environmental engineering."},
            {"code": "BUS", "name": "Business Administration", "description": "Management, finance, economics, and organizational strategy."},
        ]

        dept_objs = {}
        for d_data in departments_data:
            dept, _ = Department.objects.get_or_create(
                code=d_data["code"],
                defaults={"name": d_data["name"], "description": d_data["description"]}
            )
            dept_objs[d_data["code"]] = dept

        # 3. Courses with assigned Teachers
        courses_data = [
            {"code": "CS101", "name": "Data Structures & Algorithms", "dept": "CS", "credits": 4, "semester": 1, "teacher": teacher1_user},
            {"code": "CS102", "name": "Database Management Systems", "dept": "CS", "credits": 4, "semester": 2, "teacher": teacher1_user},
            {"code": "CS103", "name": "Web Development with React & Django", "dept": "CS", "credits": 3, "semester": 3, "teacher": teacher1_user},
            {"code": "EC101", "name": "Digital Circuit Design", "dept": "ECE", "credits": 3, "semester": 1, "teacher": teacher2_user},
            {"code": "EC102", "name": "Signals & Systems", "dept": "ECE", "credits": 4, "semester": 2, "teacher": teacher2_user},
            {"code": "ME101", "name": "Engineering Thermodynamics", "dept": "ME", "credits": 4, "semester": 1, "teacher": None},
            {"code": "CE101", "name": "Structural Analysis", "dept": "CE", "credits": 3, "semester": 2, "teacher": None},
            {"code": "BUS101", "name": "Financial Accounting & Analytics", "dept": "BUS", "credits": 3, "semester": 1, "teacher": None},
        ]

        course_objs = []
        for c_data in courses_data:
            course, created = Course.objects.get_or_create(
                code=c_data["code"],
                defaults={
                    "name": c_data["name"],
                    "department": dept_objs[c_data["dept"]],
                    "teacher": c_data["teacher"],
                    "credits": c_data["credits"],
                    "semester": c_data["semester"],
                    "description": f"Core course for {c_data['name']}."
                }
            )
            if not created:
                course.teacher = c_data["teacher"]
                course.save()
            course_objs.append(course)

        # 4. Students
        students_list = [
            {"roll": "STU2025001", "first": "Alex", "last": "Johnson", "email": "alex.johnson@student.college.edu", "gender": "Male", "dept": "CS", "sem": 3, "dob": "2003-05-14", "user": student_user, "course": "Computer Science & Engineering"},
            {"roll": "STU2025002", "first": "Sophia", "last": "Williams", "email": "sophia.w@student.college.edu", "gender": "Female", "dept": "CS", "sem": 3, "dob": "2003-08-22", "course": "Computer Science & Engineering"},
            {"roll": "STU2025003", "first": "Ethan", "last": "Brown", "email": "ethan.b@student.college.edu", "gender": "Male", "dept": "CS", "sem": 2, "dob": "2004-01-10", "course": "Computer Science & Engineering"},
            {"roll": "STU2025004", "first": "Emma", "last": "Davis", "email": "emma.d@student.college.edu", "gender": "Female", "dept": "ECE", "sem": 2, "dob": "2003-11-05", "course": "Electronics & Communication"},
            {"roll": "STU2025005", "first": "Liam", "last": "Miller", "email": "liam.m@student.college.edu", "gender": "Male", "dept": "ECE", "sem": 1, "dob": "2004-03-18", "course": "Electronics & Communication"},
            {"roll": "STU2025006", "first": "Olivia", "last": "Wilson", "email": "olivia.w@student.college.edu", "gender": "Female", "dept": "ME", "sem": 1, "dob": "2003-09-30", "course": "Mechanical Engineering"},
            {"roll": "STU2025007", "first": "Noah", "last": "Taylor", "email": "noah.t@student.college.edu", "gender": "Male", "dept": "ME", "sem": 4, "dob": "2002-12-12", "course": "Mechanical Engineering"},
            {"roll": "STU2025008", "first": "Ava", "last": "Anderson", "email": "ava.a@student.college.edu", "gender": "Female", "dept": "CE", "sem": 2, "dob": "2003-07-07", "course": "Civil Engineering"},
            {"roll": "STU2025009", "first": "Lucas", "last": "Thomas", "email": "lucas.t@student.college.edu", "gender": "Male", "dept": "BUS", "sem": 1, "dob": "2004-02-14", "course": "Business Administration"},
            {"roll": "STU2025010", "first": "Mia", "last": "Jackson", "email": "mia.j@student.college.edu", "gender": "Female", "dept": "BUS", "sem": 3, "dob": "2003-04-25", "course": "Business Administration"},
        ]

        student_objs = []
        for s_data in students_list:
            st, _ = Student.objects.get_or_create(
                roll_number=s_data["roll"],
                defaults={
                    "name": f"{s_data['first']} {s_data['last']}",
                    "first_name": s_data['first'],
                    "last_name": s_data['last'],
                    "email": s_data["email"],
                    "mobile_number": f"9876543{random.randint(100, 999)}",
                    "gender": s_data["gender"],
                    "date_of_birth": s_data["dob"],
                    "department": dept_objs[s_data["dept"]],
                    "course": s_data["course"],
                    "current_semester": s_data["sem"],
                    "status": "Active",
                    "address": f"{random.randint(10, 999)} University Campus Road",
                    "user": s_data.get("user")
                }
            )
            student_objs.append(st)

        # 5. Enrollments & Attendance & Marks
        today = datetime.date.today()
        statuses = ["Present", "Present", "Present", "Late", "Absent"]

        for st in student_objs:
            matching_courses = [c for c in course_objs if c.department == st.department]
            if not matching_courses:
                matching_courses = course_objs[:2]

            for course in matching_courses[:2]:
                en, _ = Enrollment.objects.get_or_create(
                    student=st,
                    course=course,
                    academic_year="2025-2026",
                    semester=st.current_semester,
                    defaults={"status": "Enrolled"}
                )

                for day_offset in range(1, 10):
                    att_date = today - datetime.timedelta(days=day_offset)
                    if att_date.weekday() < 5:
                        Attendance.objects.get_or_create(
                            student=st,
                            course=course,
                            date=att_date,
                            defaults={"status": random.choice(statuses), "remarks": "Regular Lecture"}
                        )

                Mark.objects.get_or_create(
                    student=st,
                    course=course,
                    exam_type="Midterm",
                    defaults={"marks_obtained": random.randint(70, 95), "max_marks": 100.0, "remarks": "Midterm Exam"}
                )

        self.stdout.write(self.style.SUCCESS("Database seeded with multi-teacher course assignments!"))
