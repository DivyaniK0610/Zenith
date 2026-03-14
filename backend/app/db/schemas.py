from pydantic import BaseModel, Field, model_validator
from enum import Enum
from typing import Optional
from datetime import date

# Define exact allowed types to prevent bad data
class MetricType(str, Enum):
    BOOLEAN = "boolean"
    NUMERIC = "numeric"


class HabitCreate(BaseModel):
    user_id: str = Field(..., description="UUID of the user")
    macro_goal_id: Optional[str] = Field(None, description="UUID of the parent macro goal")
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    metric_type: MetricType
    target_value: Optional[float] = None
    unit: Optional[str] = None

    @model_validator(mode='after')
    def validate_numeric_requirements(self) -> 'HabitCreate':
        """Ensure numeric habits always have a target and a unit."""
        if self.metric_type == MetricType.NUMERIC:
            if self.target_value is None or self.unit is None:
                raise ValueError("Numeric habits must include a 'target_value' and a 'unit' (e.g., target_value=8, unit='hours').")
        elif self.metric_type == MetricType.BOOLEAN:
            # Clean up redundant data if frontend accidentally sends it
            self.target_value = None
            self.unit = None
            
        return self

class HabitLogCreate(BaseModel):
    habit_id: str = Field(..., description="UUID of the habit")
    log_date: date
    completed: Optional[bool] = None
    metric_value: Optional[float] = None
    notes: Optional[str] = Field(None, max_length=500)

    @model_validator(mode='after')
    def validate_log_data(self) -> 'HabitLogCreate':
        """Ensure the log matches its required data type exactly."""
        if self.completed is None and self.metric_value is None:
            raise ValueError("A habit log must contain either a 'completed' boolean or a 'metric_value'.")
        if self.completed is not None and self.metric_value is not None:
            raise ValueError("A habit log cannot contain both a boolean 'completed' and a numeric 'metric_value'.")
        return self