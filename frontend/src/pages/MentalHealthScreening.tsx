import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import { Navigation, Button } from '../components/ui';
import MentalHealthScreening from '../components/assessments/MentalHealthScreening';
import { User, MentalHealthAssessment } from '../types';

interface MentalHealthScreeningPageProps {
  user?: User;
  onLogout?: () => void;
}

const MentalHealthScreeningPage: React.FC<MentalHealthScreeningPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [assessmentHistory, setAssessmentHistory] = useState<MentalHealthAssessment[]>([]);

  const handleAssessmentComplete = (assessment: MentalHealthAssessment) => {
    setAssessmentHistory(prev => [assessment, ...prev]);
    console.log('Assessment completed:', assessment);
    // In a real app, this would save to the backend
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        userRole="student"
        userName={user?.profile?.fullName || 'Student'}
        onLogout={onLogout}
      />

      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-xl p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Mental Health Screening</h1>
                <p className="text-pink-100">
                  Professional assessments to understand your mental health and wellbeing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Screening Component */}
        <MentalHealthScreening
          userId={user?.id || 1}
          onAssessmentComplete={handleAssessmentComplete}
          previousAssessments={assessmentHistory}
        />
      </div>
    </div>
  );
};

export default MentalHealthScreeningPage;