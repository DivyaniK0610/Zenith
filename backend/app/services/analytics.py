from datetime import date, timedelta
from collections import defaultdict
from app.db.supabase import supabase


def _date_range(start: date, end: date) -> list[date]:
    days = (end - start).days + 1
    return [start + timedelta(days=i) for i in range(days)]


async def get_heatmap_matrix(user_id: str, weeks: int = 12) -> dict:
    end_date   = date.today()
    start_date = end_date - timedelta(weeks=weeks)

    habits_resp = supabase.table('habits').select('id, title').eq('user_id', user_id).execute()
    habits      = habits_resp.data or []
    habit_ids   = [h['id'] for h in habits]

    if not habit_ids:
        return {"habits": [], "date_range": [], "matrix": {}}

    logs_resp = (
        supabase.table('habit_logs')
        .select('habit_id, log_date, completed, metric_value, duration_logged')
        .in_('habit_id', habit_ids)
        .gte('log_date', start_date.isoformat())
        .lte('log_date', end_date.isoformat())
        .execute()
    )
    logs = logs_resp.data or []

    completion_map: dict[str, dict[str, bool]] = defaultdict(dict)
    for log in logs:
        hid      = log['habit_id']
        log_date = log['log_date']
        is_done  = (
            log.get('completed') is True
            or (log.get('metric_value') is not None and log['metric_value'] > 0)
            or (log.get('duration_logged') is not None and log['duration_logged'] > 0)
        )
        completion_map[hid][log_date] = is_done

    all_dates    = _date_range(start_date, end_date)
    date_strings = [d.isoformat() for d in all_dates]

    matrix: dict[str, list[dict]] = {}
    for habit in habits:
        hid  = habit['id']
        rows = []
        for d in date_strings:
            status = completion_map[hid].get(d)
            rows.append({
                "date":      d,
                "completed": status if status is not None else None,
            })
        matrix[hid] = rows

    weekly_summary = []
    for week_start in range(0, len(all_dates), 7):
        week_dates  = date_strings[week_start:week_start + 7]
        total_slots = len(week_dates) * len(habits)
        completed   = sum(
            1
            for h in habits
            for d in week_dates
            if completion_map[h['id']].get(d) is True
        )
        weekly_summary.append({
            "week_start":     week_dates[0] if week_dates else None,
            "completion_rate": round(completed / total_slots, 2) if total_slots else 0,
        })

    return {
        "habits":         habits,
        "date_range":     date_strings,
        "matrix":         matrix,
        "weekly_summary": weekly_summary,
    }


async def get_daily_completion_rate(user_id: str, days: int = 30) -> list[dict]:
    end_date   = date.today()
    start_date = end_date - timedelta(days=days)

    habits_resp = supabase.table('habits').select('id').eq('user_id', user_id).execute()
    habits      = habits_resp.data or []
    habit_ids   = [h['id'] for h in habits]
    total_habits = len(habit_ids)

    if not habit_ids:
        return []

    logs_resp = (
        supabase.table('habit_logs')
        .select('habit_id, log_date, completed, metric_value, duration_logged')
        .in_('habit_id', habit_ids)
        .gte('log_date', start_date.isoformat())
        .lte('log_date', end_date.isoformat())
        .execute()
    )
    logs = logs_resp.data or []

    completions_by_date: dict[str, int] = defaultdict(int)
    for log in logs:
        is_done = (
            log.get('completed') is True
            or (log.get('metric_value') is not None and log['metric_value'] > 0)
            or (log.get('duration_logged') is not None and log['duration_logged'] > 0)
        )
        if is_done:
            completions_by_date[log['log_date']] += 1

    result = []
    for d in _date_range(start_date, end_date):
        ds = d.isoformat()
        result.append({
            "date":            ds,
            "completed":       completions_by_date.get(ds, 0),
            "total":           total_habits,
            "completion_rate": round(completions_by_date.get(ds, 0) / total_habits, 2) if total_habits else 0,
        })

    return result
