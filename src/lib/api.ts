import { supabase } from './supabase';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export const api = {
  // Create a new session
  async createSession(category: string) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ category })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Parse resume and store data
  async parseResume(file: File, category: string, sessionId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('sessionId', sessionId);

    const response = await fetch(`${FUNCTIONS_URL}/parse-resume`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse resume');
    }

    return response.json();
  },

  // Generate questions based on resume
  async generateQuestions(sessionId: string) {
    const response = await fetch(`${FUNCTIONS_URL}/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate questions');
    }

    return response.json();
  },

  // Get questions for a session
  async getQuestions(sessionId: string) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_order');
    
    if (error) throw error;
    return data;
  },

  // Submit an answer (text or voice)
  async submitAnswer(params: {
    sessionId: string;
    questionId: string;
    answerText?: string;
    answerMode: 'text' | 'voice';
    responseTime: number;
    audioData?: string;
    audioDuration?: number;
  }) {
    const response = await fetch(`${FUNCTIONS_URL}/submit-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit answer');
    }

    return response.json();
  },

  // Generate evaluation report
  async generateReport(sessionId: string) {
    const response = await fetch(`${FUNCTIONS_URL}/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate report');
    }

    return response.json();
  },

  // Get report for a session
  async getReport(sessionId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get session data
  async getSession(sessionId: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) throw error;
    return data;
  },
};
