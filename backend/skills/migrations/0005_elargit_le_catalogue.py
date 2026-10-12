from django.db import migrations

CATALOG = {
    # Front-end
    "Vue.js": "FRONTEND",
    "Angular": "FRONTEND",
    "HTML/CSS": "FRONTEND",
    "Tailwind CSS": "FRONTEND",
    # Back-end
    "Django": "BACKEND",
    "Laravel": "BACKEND",
    "Spring Boot": "BACKEND",
    "Ruby on Rails": "BACKEND",
    "Go": "BACKEND",
    "Java": "BACKEND",
    "PHP": "BACKEND",
    "C#/.NET": "BACKEND",
    # Mobile
    "React Native": "MOBILE",
    "Swift": "MOBILE",
    "Kotlin": "MOBILE",
    # Données
    "MySQL": "DATA",
    "MongoDB": "DATA",
    "Redis": "DATA",
    "SQL": "DATA",
    # DevOps
    "AWS": "DEVOPS",
    "Git": "DEVOPS",
    "GitHub Actions": "DEVOPS",
    "Nginx": "DEVOPS",
    "Terraform": "DEVOPS",
    # Design
    "Figma": "DESIGN",
    # Autre
    "GraphQL": "AUTRE",
    "Rust": "AUTRE",
    "Agile/Scrum": "AUTRE",
    "Cybersécurité": "AUTRE",
}


def seed(apps, schema_editor):
    Skill = apps.get_model("skills", "Skill")
    for name, category in CATALOG.items():
        Skill.objects.get_or_create(name=name, defaults={"category": category})


def unseed(apps, schema_editor):
    Skill = apps.get_model("skills", "Skill")
    Skill.objects.filter(name__in=CATALOG, user_skills__isnull=True).delete()


class Migration(migrations.Migration):
    dependencies = [("skills", "0004_skill_endorsement")]

    operations = [migrations.RunPython(seed, unseed)]
