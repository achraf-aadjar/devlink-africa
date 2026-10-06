from django.conf import settings
from django.db import models
from django.db.models import F, Q


class Match(models.Model):
    """A scored pair of users. By convention user_a.pk < user_b.pk."""

    user_a = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    user_b = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    score = models.FloatField()
    explanation = models.JSONField(default=dict, blank=True)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "matches"
        constraints = [
            models.UniqueConstraint(fields=["user_a", "user_b"], name="unique_match_pair"),
            models.CheckConstraint(condition=Q(user_a__lt=F("user_b")), name="match_user_a_lt_user_b"),
        ]

    def __str__(self):
        return f"{self.user_a_id}~{self.user_b_id} ({self.score})"


class MatchFeedback(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="feedbacks")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="match_feedbacks"
    )
    is_relevant = models.BooleanField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["match", "author"], name="unique_feedback_per_author"),
        ]

    def __str__(self):
        return f"Feedback<{self.match_id}, {self.author_id}>"
