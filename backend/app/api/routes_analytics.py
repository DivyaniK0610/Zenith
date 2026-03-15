# routes_analytics.py — REMOVED (duplicate)
#
# The /api/v1/analytics/heatmap endpoint was a duplicate of
# GET /api/v1/game/heatmap/{user_id} already defined in routes_game.py.
#
# Frontend should use: GET /api/v1/game/heatmap/{user_id}?weeks=12
# which is wired to the same get_heatmap_matrix service function.
#
# See: backend/app/api/routes_game.py → get_heatmap()