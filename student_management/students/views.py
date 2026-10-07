from django.shortcuts import render, redirect, get_object_or_404
from .models import Student
from django.contrib import messages
from .forms import StudentForm, ContactForm
from django.core.mail import send_mail
from django.contrib.auth.decorators import login_required


def student_list(request):
    students = Student.objects.all()
    return render(request, "students/student_list.html", {"students": students})


def add_student(request):
    if request.method == "POST":
        form = StudentForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Student added successfully!")
            return redirect("student_list")
    else:
        form = StudentForm()

    return render(request, "students/add_student.html", {"form": form})


def student_details(request, id):
    student = get_object_or_404(Student, id=id)
    return render(request, "students/student_details.html", {"student": student})


def edit_student(request, id):
    student = get_object_or_404(Student, id=id)

    if request.method == "POST":
        name = request.POST.get("name", "")
        student.name = name
        parts = name.split(" ", 1)
        student.first_name = parts[0]
        student.last_name = parts[1] if len(parts) > 1 else ""
        student.roll_number = request.POST.get("roll_number")
        student.email = request.POST.get("email")
        student.mobile_number = request.POST.get("mobile_number")
        student.gender = request.POST.get("gender")
        student.date_of_birth = request.POST.get("date_of_birth")
        student.course = request.POST.get("course")
        student.address = request.POST.get("address")

        student.save()
        messages.success(request, "Student details updated successfully.")
        return redirect("student_list")

    return render(request, "students/edit_student.html", {"student": student})


def delete_student(request, id):
    student = get_object_or_404(Student, id=id)

    if request.method == "POST":
        student.delete()
        messages.success(request, "Student deleted successfully.")
        return redirect("student_list")

    return render(request, "students/delete_student.html", {"student": student})


def contact(request):
    if request.method == "POST":
        form = ContactForm(request.POST)
        if form.is_valid():
            send_mail(
                subject="New Contact Message",
                message=form.cleaned_data["message"],
                from_email=form.cleaned_data["email"],
                recipient_list=["admin@example.com"],
            )
            messages.success(request, "Message sent successfully!")
            return redirect("contact")
    else:
        form = ContactForm()

    return render(request, "students/contact.html", {"form": form})


def python_students(request):
    students = Student.objects.filter(course__icontains="python")
    return render(request, "students/student_list.html", {"students": students})
