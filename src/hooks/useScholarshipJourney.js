import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { calculateJourneyState, JOURNEY_STEPS, MANDATORY_DOC_DEFINITIONS } from '../services/scholarshipJourneyService';

export const useScholarshipJourney = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [journeyState, setJourneyState] = useState(() => calculateJourneyState({}));

  const fetchJourneyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [profileRes, docsRes, schRes, appsRes, stateRes, ocrRes] = await Promise.allSettled([
        api.get('/profile'),
        api.get('/documents'),
        api.get('/scholarships'),
        api.get('/applications'),
        api.get('/agent/state'),
        api.get('/agent/ocr_data')
      ]);

      const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
      const documents = docsRes.status === 'fulfilled' ? docsRes.value.data : [];
      const scholarships = schRes.status === 'fulfilled' ? schRes.value.data : [];
      const applications = appsRes.status === 'fulfilled' ? appsRes.value.data : [];
      const agentState = stateRes.status === 'fulfilled' ? stateRes.value.data : null;
      const ocrData = ocrRes.status === 'fulfilled' ? ocrRes.value.data : null;

      const calculated = calculateJourneyState({
        profile,
        documents,
        scholarships,
        applications,
        agentState,
        ocrData
      });

      setJourneyState(calculated);
      return calculated;
    } catch (err) {
      console.error('Error fetching scholarship journey data:', err);
      setError(err.message || 'Failed to load scholarship journey');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJourneyData();
  }, [fetchJourneyData]);

  return {
    ...journeyState,
    loading,
    error,
    refreshJourney: fetchJourneyData,
    allSteps: JOURNEY_STEPS,
    docDefinitions: MANDATORY_DOC_DEFINITIONS
  };
};

export default useScholarshipJourney;
