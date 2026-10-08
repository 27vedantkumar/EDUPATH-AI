const API_BASE = '/api';

export const api = {
  // Authentication
  async getDemoUser() {
    const res = await fetch(`${API_BASE}/auth/demo`);
    return res.json();
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  // Courses & Ingestion
  async listCourses() {
    const res = await fetch(`${API_BASE}/courses`);
    return res.json();
  },

  async uploadMaterial(courseId, file) {
    const formData = new FormData();
    formData.append('course_id', courseId);
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/courses/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // Tutor
  async askTutor(message, mode = 'beginner', courseId = 'OS_101', scopeLocation = null, language = 'en') {
    const res = await fetch(`${API_BASE}/tutor/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        mode,
        course_id: courseId,
        scope_location: scopeLocation,
        language
      })
    });
    return res.json();
  },

  async askSourceQuestion(query, documentName, locationLabel, excerpt) {
    const res = await fetch(`${API_BASE}/tutor/source-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        document_name: documentName,
        location_label: locationLabel,
        excerpt
      })
    });
    return res.json();
  },

  // Knowledge Graph & Source Explorer
  async getKnowledgeGraph(courseId) {
    const res = await fetch(`${API_BASE}/knowledge/graph/${courseId}`);
    return res.json();
  },

  async getSourceExplorer(courseId) {
    const res = await fetch(`${API_BASE}/knowledge/sources/${courseId}`);
    return res.json();
  },

  // Learner Model & Mastery
  async getLearnerProfile(userId) {
    const res = await fetch(`${API_BASE}/learner/profile/${userId}`);
    return res.json();
  },

  async getWhyAmIWeak(userId, topicId) {
    const res = await fetch(`${API_BASE}/learner/why-weak/${userId}/${topicId}`);
    return res.json();
  },

  async getTimeline(userId) {
    const res = await fetch(`${API_BASE}/learner/timeline/${userId}`);
    return res.json();
  },

  async getRecommendations(userId, courseId) {
    const res = await fetch(`${API_BASE}/recommendations/${userId}/${courseId}`);
    return res.json();
  },

  // Assessment & "Why Was I Wrong?"
  async getDiagnosticQuiz(courseId) {
    const res = await fetch(`${API_BASE}/assessment/diagnostic/${courseId}`);
    return res.json();
  },

  async getPracticeQuestions(courseId, topicName) {
    const res = await fetch(`${API_BASE}/assessment/practice/${courseId}?topic=${encodeURIComponent(topicName || '')}`);
    return res.json();
  },

  async evaluateAssessment(payload) {
    const res = await fetch(`${API_BASE}/assessment/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Flashcards (SuperMemo SM-2)
  async getFlashcards(courseId) {
    const res = await fetch(`${API_BASE}/flashcards/due/${courseId}`);
    return res.json();
  },

  async reviewFlashcard(flashcardId, rating) {
    const res = await fetch(`${API_BASE}/flashcards/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcard_id: flashcardId, quality_rating: rating })
    });
    return res.json();
  },

  // Study Planner
  async getStudyPlan(userId, courseId) {
    const res = await fetch(`${API_BASE}/planner/${userId}/${courseId}`);
    return res.json();
  },

  async generateBlitzRevision(courseId, hours = 4) {
    const res = await fetch(`${API_BASE}/planner/blitz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, hours_available: hours })
    });
    return res.json();
  },

  // Exam Simulator
  async generateMockExam(courseId, questionCount = 5, durationMinutes = 15) {
    const res = await fetch(`${API_BASE}/exams/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, question_count: questionCount, duration_minutes: durationMinutes })
    });
    return res.json();
  },

  async submitExam(payload) {
    const res = await fetch(`${API_BASE}/exams/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Coding Laboratory
  async executeCode(code, language = 'python', testCases = []) {
    const res = await fetch(`${API_BASE}/coding/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, test_cases: testCases })
    });
    return res.json();
  },

  // Educational Games
  async getGameData(gameType, courseId = 'OS_101') {
    const res = await fetch(`${API_BASE}/games/${gameType}?course_id=${courseId}`);
    return res.json();
  }
};
