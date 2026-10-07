from django.contrib import admin
from datetime import date

from .models import Student

# Register your models here.
@admin.action(description="Show selected students")
def show_selected_students(modeladmin,request,queryset):
    count = queryset.count()
    modeladmin.message_user(
        request,f"{count} student(s) selected."
    )
@admin.action(description="set selected student course to python")
def set_course_python(modeladmin,request,queryset):
    updated = queryset.update(course="python")

    modeladmin.message_user(
        request,f"{updated} student(s) updated successfully."
    )

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):

    list_per_page = 10

    date_hierarchy = "date_of_birth"

    @admin.action(description="Age")
    def student_age(self,obj):
        today = date.today()

        age = today.year - obj.date_of_birth.year

        if (today.month, today.day) < (obj.date_of_birth.month,obj.date_of_birth.day):
            age -= 1

        return age

    readonly_fields = ("student_age",)




    list_display = (
        "id",
        "name",
        "roll_number",
        "email",
        "mobile_number",
        "gender",
        "course",
        "student_age"
    )

    search_fields = (
        "name",
        "roll_number",
        "email",
    )

    list_filter = (
        "gender",
        "course",
    )

    ordering = ("-id",)

    actions = [show_selected_students,
               set_course_python,
        ]

    fieldsets = (
        (
            "Student Information",
            {
                "fields": (
                    "name",
                    "roll_number",
                    "email",
                    "mobile_number",
                )
            },
        ),
        (
            "Personal Information",
            {
                "fields": (
                    "gender",
                    "date_of_birth",
                    "student_age",
                )
            },
        ),

        (
            "Course Information",
            {
                "fields": (
                "course",
                "address",
                )
            }
        )
    )