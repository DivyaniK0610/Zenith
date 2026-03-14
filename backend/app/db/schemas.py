from pydantic import BaseModel, Field, model_validator
from enum import Enum
from typing import Optional
from datetime import date

class MetricType(str, Enum):
    BOOLEAN = "boolean"
    NUMERIC = "numeric"

class HabitType(str, Enum):
    STANDARD = "standard"
    TIMER    = "timer"

class HabitCreate(BaseModel):
    user_id:       str            = Field(..., description="UUID of the user")
    macro_goal_id: Optional[str]  = Field(None, description="UUID of the parent macro goal")
    title:         str            = Field(..., min_length=1, max_length=100)
    description:   Optional[str]  = Field(None, max_length=500)
    metric_type:   MetricType
    habit_type:    HabitType      = Field(HabitType.STANDARD)
    target_value:  Optional[float] = None
    unit:          Optional[str]   = None
    duration_mins: Optional[int]   = Field(None, ge=1, le=480, description="Required for timer habits. Max 8 hours.")

    @model_validator(mode='after')
    def validate_numeric_requirements(self) -> 'HabitCreate':
        if self.metric_type == MetricType.NUMERIC:
            if self.target_value is None or self.unit is None:
                raise ValueError("Numeric habits must include a 'target_value' and a 'unit'.")
        elif self.metric_type == MetricType.BOOLEAN:
            self.target_value = None
            self.unit = None

        if self.habit_type == HabitType.TIMER:
            if self.duration_mins is None:
                raise ValueError("Timer habits must include 'duration_mins' (1–480).")

        return self

class HabitLogCreate(BaseModel):
    habit_id:        str           = Field(..., description="UUID of the habit")
    log_date:        date
    completed:       Optional[bool]  = None
    metric_value:    Optional[float] = None
    duration_logged: Optional[int]   = Field(None, ge=0, description="Actual minutes logged for timer habits")
    notes:           Optional[str]   = Field(None, max_length=500)

    @model_validator(mode='after')
    def validate_log_data(self) -> 'HabitLogCreate':
        if self.completed is None and self.metric_value is None and self.duration_logged is None:
            raise ValueError("A log must contain 'completed', 'metric_value', or 'duration_logged'.")
        truthy = sum([
            self.completed is not None,
            self.metric_value is not None,
            self.duration_logged is not None,
        ])
        if truthy > 1:
            raise ValueError("Provide only one of: 'completed', 'metric_value', or 'duration_logged'.")
        return self