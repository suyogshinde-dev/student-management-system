from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN'


class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return hasattr(request.user, 'profile') and request.user.profile.role in ['ADMIN', 'TEACHER']


class IsAdminOrTeacherOrReadOnlyStudent(permissions.BasePermission):
    """
    Custom Permission:
    - Admins: Full access.
    - Teachers: Access to objects/courses assigned to them.
    - Students: Read-only access to their own data.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        role = getattr(request.user.profile, 'role', 'STUDENT') if hasattr(request.user, 'profile') else 'STUDENT'

        if role in ['ADMIN', 'TEACHER']:
            return True

        if request.method in permissions.SAFE_METHODS:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        role = getattr(request.user.profile, 'role', 'STUDENT') if hasattr(request.user, 'profile') else 'STUDENT'

        if role == 'ADMIN':
            return True

        if role == 'TEACHER':
            # Check if teacher is assigned to the course directly or via related objects
            if hasattr(obj, 'teacher') and obj.teacher == request.user:
                return True
            if hasattr(obj, 'course') and hasattr(obj.course, 'teacher') and obj.course.teacher == request.user:
                return True
            if hasattr(obj, 'enrollments') and obj.enrollments.filter(course__teacher=request.user).exists():
                return True
            if request.method in permissions.SAFE_METHODS:
                return True
            return False

        if role == 'STUDENT':
            if request.method in permissions.SAFE_METHODS:
                if hasattr(obj, 'user') and obj.user == request.user:
                    return True
                if hasattr(obj, 'student') and hasattr(obj.student, 'user') and obj.student.user == request.user:
                    return True

        return False
