from django.db import migrations

CATALOG = [
    "React",
    "Next.js",
    "TypeScript",
    "Flutter",
    "Node.js",
    "Python",
    "FastAPI",
    "PostgreSQL",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Linux",
    "UI/UX Design",
    "Machine Learning",
]


def seed(apps, schema_editor):
    Skill = apps.get_model("skills", "Skill")
    for name in CATALOG:
        Skill.objects.get_or_create(name=name)


def unseed(apps, schema_editor):
    Skill = apps.get_model("skills", "Skill")
    Skill.objects.filter(name__in=CATALOG, user_skills__isnull=True).delete()


class Migration(migrations.Migration):
    dependencies = [("skills", "0001_initial")]

    operations = [migrations.RunPython(seed, unseed)]
