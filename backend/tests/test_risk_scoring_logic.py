import unittest
from unittest.mock import MagicMock
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services import risk_assessment_service
from backend.models import RiskAssessmentType, RiskAssessmentQuestion, RiskAssessmentAnswer, RiskAssessment

class TestRiskScoring(unittest.TestCase):
    
    def setUp(self):
        self.mock_db = MagicMock()
        
    def test_calculate_score_with_matrix(self):
        # 1. Setup Mock Assessment Type (ORAS-Like)
        mock_type = RiskAssessmentType(
            name="Test-Type",
            scoring_matrix=[
                {"label": "Low", "min": 0, "max": 5},
                {"label": "Medium", "min": 6, "max": 10},
                {"label": "High", "min": 11, "max": 99}
            ]
        )
        
        # 2. Setup Mock Assessment
        mock_assessment = RiskAssessment(
            assessment_id="123",
            assessment_type="Test-Type",
            offender_id="abc"
        )
        
        # 3. Setup Answers & Questions
        # Q1: Option-based (High value) -> Score 5
        q1 = RiskAssessmentQuestion(universal_tag="q1", input_type="select", options=[{"label": "Bad", "score": 5}, {"label": "Good", "score": 0}])
        a1 = RiskAssessmentAnswer(question_tag="q1", value="Bad")
        
        # Q2: Integer-based (Count) -> Score 3
        q2 = RiskAssessmentQuestion(universal_tag="q2", input_type="integer")
        a2 = RiskAssessmentAnswer(question_tag="q2", value="3")
        
        # Q3: Boolean-based (Yes) -> Score 1
        q3 = RiskAssessmentQuestion(universal_tag="q3", input_type="boolean")
        a3 = RiskAssessmentAnswer(question_tag="q3", value="Yes")

        # Mock DB Queries
        # assessment query
        self.mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_assessment, # 1st call: get assessment
            mock_type,       # 2nd call: get type
            q1, q2, q3       # subsequent calls via loop: get question
        ]
        
        # answers query
        self.mock_db.query.return_value.filter.return_value.all.return_value = [a1, a2, a3]
        
        # Execute
        result = risk_assessment_service.calculate_score(self.mock_db, "123")
        
        # Assertions
        expected_score = 5 + 3 + 1 # = 9
        self.assertEqual(result["total_score"], 9)
        self.assertEqual(result["risk_level"], "Medium") # 9 falls in 6-10 range
        self.assertEqual(result["details"]["q1"], 5)
        
    def test_calculate_score_out_of_bounds(self):
         # Test fallback or boundary conditions
        mock_type = RiskAssessmentType(
            name="Test-Type",
            scoring_matrix=[{"label": "Safe", "min": 0, "max": 2}]
        )
        mock_assessment = RiskAssessment(assessment_id="123", assessment_type="Test-Type")
        
        # Q1: Score 10 (Way above max)
        q1 = RiskAssessmentQuestion(universal_tag="q1", input_type="integer")
        a1 = RiskAssessmentAnswer(question_tag="q1", value="10")
        
        self.mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_assessment, 
            mock_type, 
            q1
        ]
        self.mock_db.query.return_value.filter.return_value.all.return_value = [a1]
        
        result = risk_assessment_service.calculate_score(self.mock_db, "123")
        
        self.assertEqual(result["total_score"], 10)
        self.assertEqual(result["risk_level"], "Unknown") # 10 is not in [0, 2]

if __name__ == '__main__':
    unittest.main()
