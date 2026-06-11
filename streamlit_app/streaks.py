"""Streak calculation from check-in dates."""
from __future__ import annotations

from datetime import date, timedelta


def current_streak(dates: list[date], today: date | None = None) -> int:
    """Count consecutive days ending today (or yesterday if today not checked)."""
    if not dates:
        return 0
    today = today or date.today()
    s = set(dates)
    # Allow streak to count from yesterday if not yet checked today
    cursor = today if today in s else today - timedelta(days=1)
    streak = 0
    while cursor in s:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def longest_streak(dates: list[date]) -> int:
    if not dates:
        return 0
    sorted_d = sorted(set(dates))
    best = cur = 1
    for i in range(1, len(sorted_d)):
        if (sorted_d[i] - sorted_d[i - 1]).days == 1:
            cur += 1
            best = max(best, cur)
        else:
            cur = 1
    return best
