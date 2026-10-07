from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import api_views

# DRF Router for API endpoints
router = DefaultRouter()
router.register(r'departments', api_views.DepartmentViewSet, basename='department')
router.register(r'courses', api_views.CourseViewSet, basename='course')
router.register(r'students', api_views.StudentViewSet, basename='student-api')
router.register(r'enrollments', api_views.EnrollmentViewSet, basename='enrollment')
router.register(r'attendance', api_views.AttendanceViewSet, basename='attendance')
router.register(r'marks', api_views.MarkViewSet, basename='mark')
router.register(r'notifications', api_views.NotificationViewSet, basename='notification')

urlpatterns = [
    # REST API routes
    path('api/auth/login/', api_views.login_api, name='api_login'),
    path('api/auth/me/', api_views.me_api, name='api_me'),
    path('api/auth/register/', api_views.register_api, name='api_register'),
    path('api/dashboard/stats/', api_views.dashboard_stats, name='api_dashboard_stats'),
    path('api/reports/students/csv/', api_views.export_students_csv, name='api_export_students'),
    path('api/reports/attendance/csv/', api_views.export_attendance_csv, name='api_export_attendance'),
    path('api/reports/marks/csv/', api_views.export_marks_csv, name='api_export_marks'),
    path('api/', include(router.urls)),

    # Legacy / Traditional Django Template routes
    path("", views.student_list, name="student_list"),
    path("add/", views.add_student, name="add_student"),
    path("<int:id>/", views.student_details, name="student_details"),
    path("<int:id>/edit/", views.edit_student, name="edit_student"),
    path("<int:id>/delete/", views.delete_student, name="delete_student"),
    path("contact/", views.contact, name="contact"),
    path("python-students/", views.python_students, name="python_students"),
]