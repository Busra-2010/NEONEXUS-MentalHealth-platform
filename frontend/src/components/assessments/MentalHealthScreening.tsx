import React, { useState } from 'react';
import { Brain, Activity, Shield, AlertTriangle, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { Card, Button } from '../ui';
import { MentalHealthAssessment, AssessmentType, RiskLevel } from '../../types';

interface ScreeningQuestion {
  id: string;
  question: string;
  options: { value: number; label: string }[];
}

interface AssessmentConfig {
  type: AssessmentType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  duration: string;
  questions: ScreeningQuestion[];
  scoringInfo: {
    ranges: { min: number; max: number; level: RiskLevel; description: string; color: string }[];
  };
}

interface MentalHealthScreeningProps {
  userId: number;
  onAssessmentComplete?: (assessment: MentalHealthAssessment) => void;
  previousAssessments?: MentalHealthAssessment[];
}

const MentalHealthScreening: React.FC<MentalHealthScreeningProps> = ({
  userId,
  onAssessmentComplete,
  previousAssessments = [],
}) => {
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentConfig | null>(null);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedAssessment, setCompletedAssessment] = useState<MentalHealthAssessment | null>(null);
  const [showResults, setShowResults] = useState(false);

  const assessmentConfigs: AssessmentConfig[] = [
    {
      type: 'phq9',
      title: 'PHQ-9 Depression Screening',
      description: 'Assess symptoms of depression over the past two weeks',
      icon: Brain,
      color: 'from-blue-500 to-blue-600',
      duration: '5-7 minutes',
      questions: [
        {
          id: 'phq1',
          question: 'Little interest or pleasure in doing things',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'phq2',
          question: 'Feeling down, depressed, or hopeless',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'phq3',
          question: 'Trouble falling or staying asleep, or sleeping too much',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'phq4',
          question: 'Feeling tired or having little energy',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'phq5',
          question: 'Poor appetite or overeating',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'phq6',
          question: 'Feeling bad about yourself or that you are a failure or have let yourself or your family down',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'phq7',
          question: 'Trouble concentrating on things, such as reading or watching TV',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'phq8',
          question: 'Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you have been moving around a lot more than usual',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'phq9',
          question: 'Thoughts that you would be better off dead, or thoughts of hurting yourself',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        }
      ],
      scoringInfo: {
        ranges: [
          { min: 0, max: 4, level: 'low', description: 'Minimal depression', color: 'text-green-600' },
          { min: 5, max: 9, level: 'low', description: 'Mild depression', color: 'text-yellow-600' },
          { min: 10, max: 14, level: 'medium', description: 'Moderate depression', color: 'text-orange-600' },
          { min: 15, max: 19, level: 'high', description: 'Moderately severe depression', color: 'text-red-600' },
          { min: 20, max: 27, level: 'crisis', description: 'Severe depression', color: 'text-red-700' }
        ]
      }
    },
    {
      type: 'gad7',
      title: 'GAD-7 Anxiety Screening',
      description: 'Assess symptoms of generalized anxiety over the past two weeks',
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      duration: '3-5 minutes',
      questions: [
        {
          id: 'gad1',
          question: 'Feeling nervous, anxious, or on edge',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'gad2',
          question: 'Not being able to stop or control worrying',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'gad3',
          question: 'Worrying too much about different things',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'gad4',
          question: 'Trouble relaxing',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'gad5',
          question: 'Being so restless that it is hard to sit still',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'gad6',
          question: 'Becoming easily annoyed or irritable',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        },
        {
          id: 'gad7',
          question: 'Feeling afraid, as if something awful might happen',
          options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
          ]
        }
      ],
      scoringInfo: {
        ranges: [
          { min: 0, max: 4, level: 'low', description: 'Minimal anxiety', color: 'text-green-600' },
          { min: 5, max: 9, level: 'low', description: 'Mild anxiety', color: 'text-yellow-600' },
          { min: 10, max: 14, level: 'medium', description: 'Moderate anxiety', color: 'text-orange-600' },
          { min: 15, max: 21, level: 'high', description: 'Severe anxiety', color: 'text-red-600' }
        ]
      }
    }
  ];

  const calculateScore = (assessment: AssessmentConfig, responses: Record<string, number>) => {
    return assessment.questions.reduce((total, question) => {
      return total + (responses[question.id] || 0);
    }, 0);
  };

  const getRiskLevel = (score: number, assessment: AssessmentConfig): { level: RiskLevel; description: string; color: string } => {
    const range = assessment.scoringInfo.ranges.find(r => score >= r.min && score <= r.max);
    return range || { level: 'low', description: 'No data', color: 'text-gray-600' };
  };

  const handleStartAssessment = (assessment: AssessmentConfig) => {
    setCurrentAssessment(assessment);
    setResponses({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setCompletedAssessment(null);
  };

  const handleResponse = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentAssessment && currentQuestionIndex < currentAssessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleCompleteAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCompleteAssessment = async () => {
    if (!currentAssessment) return;

    setIsCompleting(true);
    
    try {
      const score = calculateScore(currentAssessment, responses);
      const riskInfo = getRiskLevel(score, currentAssessment);
      
      const assessment: MentalHealthAssessment = {
        id: Math.floor(Math.random() * 1000000),
        userId,
        assessmentType: currentAssessment.type,
        score,
        responses,
        riskLevel: riskInfo.level,
        isAnonymous: false,
        createdAt: new Date().toISOString()
      };

      setCompletedAssessment(assessment);
      setShowResults(true);
      
      if (onAssessmentComplete) {
        onAssessmentComplete(assessment);
      }

    } catch (error) {
      console.error('Error completing assessment:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleReturnToMenu = () => {
    setCurrentAssessment(null);
    setShowResults(false);
    setCompletedAssessment(null);
    setResponses({});
    setCurrentQuestionIndex(0);
  };

  const getLastAssessmentDate = (type: AssessmentType) => {
    const lastAssessment = previousAssessments
      .filter(a => a.assessmentType === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    if (lastAssessment) {
      const date = new Date(lastAssessment.createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return null;
  };

  if (showResults && completedAssessment && currentAssessment) {
    const riskInfo = getRiskLevel(completedAssessment.score!, currentAssessment);
    
    return (
      <div className="space-y-6">
        <Card padding="lg" className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Assessment Complete</h3>
            <p className="text-gray-600">Your {currentAssessment.title} results are ready</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {completedAssessment.score}/{currentAssessment.questions.length * 3}
              </div>
              <div className={`text-lg font-medium ${riskInfo.color} mb-2`}>
                {riskInfo.description}
              </div>
              <div className="text-sm text-gray-600">
                Completed on {new Date(completedAssessment.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {riskInfo.level === 'high' || riskInfo.level === 'crisis' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-medium text-red-800 mb-1">Recommended Action</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Your results suggest you may benefit from professional support. Consider speaking with a counselor.
                  </p>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Book Counseling Session
                  </Button>
                </div>
              </div>
            </div>
          ) : riskInfo.level === 'medium' ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-medium text-orange-800 mb-1">Consider Support</h4>
                  <p className="text-sm text-orange-700">
                    You might benefit from self-help resources or talking to someone about how you're feeling.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-medium text-green-800 mb-1">Good Mental Health</h4>
                  <p className="text-sm text-green-700">
                    Keep up the good work! Continue with healthy habits and regular check-ins.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button onClick={handleReturnToMenu} variant="outline" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Take Another Assessment
            </Button>
            <Button onClick={() => window.print()} variant="ghost" className="flex-1">
              📄 Save Results
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (currentAssessment) {
    const currentQuestion = currentAssessment.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentAssessment.questions.length) * 100;

    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{currentAssessment.title}</h3>
              <button onClick={handleReturnToMenu} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {currentAssessment.questions.length}
            </p>
          </div>

          <div className="mb-8">
            <h4 className="text-lg font-medium text-gray-900 mb-6">
              Over the last 2 weeks, how often have you been bothered by the following problem:
            </h4>
            <p className="text-base text-gray-800 mb-6 font-medium">
              {currentQuestion.question}
            </p>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleResponse(currentQuestion.id, option.value)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    responses[currentQuestion.id] === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      responses[currentQuestion.id] === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {responses[currentQuestion.id] === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={responses[currentQuestion.id] === undefined}
              className="flex items-center"
            >
              {currentQuestionIndex === currentAssessment.questions.length - 1 ? (
                isCompleting ? 'Completing...' : 'Complete Assessment'
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mental Health Screening</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Take standardized assessments to better understand your mental health. 
          These screenings are confidential and can help identify areas where you might benefit from support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assessmentConfigs.map((assessment) => {
          const lastTaken = getLastAssessmentDate(assessment.type);
          const Icon = assessment.icon;
          
          return (
            <Card key={assessment.type} padding="lg" className="hover:shadow-lg transition-all duration-200">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${assessment.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{assessment.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{assessment.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                    <span>⏱️ {assessment.duration}</span>
                    <span>📊 {assessment.questions.length} questions</span>
                    {lastTaken && <span>📅 Last: {lastTaken}</span>}
                  </div>

                  <Button
                    onClick={() => handleStartAssessment(assessment)}
                    className="w-full"
                    size="sm"
                  >
                    {lastTaken ? 'Retake Assessment' : 'Start Assessment'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card padding="lg" className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Privacy & Confidentiality</h4>
            <p className="text-sm text-blue-700">
              Your assessment results are confidential and stored securely. 
              These screenings are for informational purposes and do not replace professional diagnosis.
              If you're experiencing thoughts of self-harm, please contact emergency services immediately.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MentalHealthScreening;