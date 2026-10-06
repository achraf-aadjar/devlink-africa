"""PostgreSQL backend built on pg8000, with JSONField support enabled.

django-pg8000 declares `supports_json_field = False`, which makes Django reject
every JSONField (check fields.E180), and its vendor name ("postgresql_pg8000")
hides the as_postgresql() variants of JSON key lookups. pg8000 returns jsonb as text, which is what
Django's JSONField expects, so we re-enable it here. Round-trips are covered by
tests/test_json_fields.py.
"""

from django_pg8000.base import DatabaseWrapper as Pg8000DatabaseWrapper


class DatabaseWrapper(Pg8000DatabaseWrapper):
    # Django selects as_postgresql() lookup/transform variants from this value.
    vendor = "postgresql"


DatabaseWrapper.features_class = type(
    "DatabaseFeatures",
    (Pg8000DatabaseWrapper.features_class,),
    {"supports_json_field": True},
)
