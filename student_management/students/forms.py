from django import forms
from .models import Student
from datetime import date

class StudentForm(forms.ModelForm):

    gender = forms.ChoiceField(
        choices=Student.Gender.choices,
        widget=forms.RadioSelect(),
        required=True
        
    )
    class Meta:
        model = Student
        fields = "__all__"

        widgets = {
            "name": forms.TextInput(attrs={"class":"form-control"}),
            "roll_number": forms.TextInput(attrs={"class":"form-control"}),
            "email": forms.EmailInput(attrs={"class":"form-control"}),
            "mobile_number": forms.TextInput(attrs={"class":"form-control"}),

            "date_of_birth": forms.DateInput(
                attrs={"class":"form-control", "type":"date"}
            ),
            "course": forms.TextInput(attrs={"class":"form-control"}),
            "address": forms.Textarea(attrs={"class":"form-control"}),
            
        }

    def clean_mobile_number(self):
        mobile = self.cleaned_data["mobile_number"]

        if not mobile.isdigit():
            raise forms.ValidationError("Mobile number must contain only digits.")

        if len(mobile) != 10:
            raise forms.ValidationError("Mobile number must be exactly 10 digits.")

        return mobile

    def clean_name(self):
        name = self.cleaned_data["name"]

        if not name.replace(" ","").isalpha():
            raise forms.ValidationError("Name must contain only letters.")

        return name

    def clean(self):
        cleaned_data = super().clean()

        date_of_birth = cleaned_data.get("date_of_birth")

        if date_of_birth:
            today = date.today()

            age = today.year - date_of_birth.year

            if (today.month,today.day) < (date_of_birth.month , date_of_birth.day):
                age -= 1

            if age < 15:
                raise forms.ValidationError("Student must be at least 15 years old")

        return cleaned_data

class ContactForm(forms.Form):
    name = forms.CharField(max_length=100)
    email = forms.EmailField()
    message = forms.CharField(widget=forms.Textarea)
        