/**
 * Ultra-Fast AI Notes Engine
 * Generates structured, subject-agnostic notes for all subjects
 * Optimized for speed and consistency
 */

export interface NotesSection {
  quickOverview: string;
  keyConcepts: string[];
  detailedExplanation: string;
  examplesAndApplications: string[];
  formulasAndFacts?: string[];
  examTipsAndTraps: string[];
  quickRevision: string;
}

export interface SubjectNotes {
  subject: string;
  chapter: string;
  class: string;
  notes: NotesSection;
  generatedAt: Date;
  estimatedReadTime: number;
}

// Subject-specific prompt templates for maximum speed
const SUBJECT_PROMPTS = {
  MATH: `Generate ultra-compact study notes for a math topic. Focus on:
1. Quick Overview (1 sentence)
2. Key Concepts (3-5 points)
3. Step-by-step procedures
4. Real formulas with examples
5. Common exam traps
6. One-line revision summary

Format as JSON with these exact keys:
{"quickOverview":"","keyConcepts":[],"detailedExplanation":"","examplesAndApplications":[],"formulasAndFacts":[],"examTipsAndTraps":[],"quickRevision":""}`,

  SCIENCE: `Generate focused science notes covering:
1. Quick Overview (simple language)
2. Key Concepts (main ideas)
3. How it works (mechanisms)
4. Real-world examples
5. Important facts/rules
6. Common misconceptions
7. Revision summary

Return JSON: {"quickOverview":"","keyConcepts":[],"detailedExplanation":"","examplesAndApplications":[],"formulasAndFacts":[],"examTipsAndTraps":[],"quickRevision":""}`,

  HISTORY: `Generate concise history notes including:
1. Quick Overview
2. Key Events/Concepts
3. Timeline and sequence
4. Cause-effect relationships
5. Historical examples
6. Important dates/names
7. Quick revision

JSON format: {"quickOverview":"","keyConcepts":[],"detailedExplanation":"","examplesAndApplications":[],"formulasAndFacts":[],"examTipsAndTraps":[],"quickRevision":""}`,

  GEOGRAPHY: `Generate geography notes with:
1. Quick Overview
2. Key Locations/Concepts
3. Geographic features
4. Climate/Environmental factors
5. Examples and case studies
6. Important facts
7. Quick revision

JSON: {"quickOverview":"","keyConcepts":[],"detailedExplanation":"","examplesAndApplications":[],"formulasAndFacts":[],"examTipsAndTraps":[],"quickRevision":""}`,

  LANGUAGE: `Generate language study notes for:
1. Quick Overview
2. Grammar/Vocabulary rules
3. Usage and structure
4. Examples and patterns
5. Common mistakes
6. Practice tips
7. Quick revision

JSON: {"quickOverview":"","keyConcepts":[],"detailedExplanation":"","examplesAndApplications":[],"formulasAndFacts":[],"examTipsAndTraps":[],"quickRevision":""}`,

  CS: `Generate computer science notes with:
1. Concept Overview
2. Key principles
3. Algorithm/Implementation steps
4. Code examples
5. Formulas/Complexity analysis
6. Common pitfalls
7. Quick revision

JSON: {"quickOverview":"","keyConcepts":[],"detailedExplanation":"","examplesAndApplications":[],"formulasAndFacts":[],"examTipsAndTraps":[],"quickRevision":""}`,

  DEFAULT: `Generate ultra-fast study notes for any topic:
1. Quick Overview (2-3 lines)
2. Key Concepts (bullet points)
3. Detailed Explanation (short paragraphs)
4. Examples/Applications
5. Important Facts/Rules
6. Exam Tips & Common Mistakes
7. One-glance Quick Revision

Return ONLY valid JSON with these keys:
{"quickOverview":"brief overview","keyConcepts":["concept1","concept2"],"detailedExplanation":"explanation text","examplesAndApplications":["example1"],"formulasAndFacts":["fact1"],"examTipsAndTraps":["tip1"],"quickRevision":"revision text"}`,
};

// Detect subject type from keywords
function detectSubjectType(
  subject: string,
  chapter: string
): keyof typeof SUBJECT_PROMPTS {
  const combined = `${subject} ${chapter}`.toLowerCase();

  if (
    combined.includes('math') ||
    combined.includes('algebra') ||
    combined.includes('geometry') ||
    combined.includes('calculus') ||
    combined.includes('trigonometry')
  ) {
    return 'MATH';
  }
  if (
    combined.includes('physics') ||
    combined.includes('chemistry') ||
    combined.includes('biology') ||
    combined.includes('science')
  ) {
    return 'SCIENCE';
  }
  if (
    combined.includes('history') ||
    combined.includes('ancient') ||
    combined.includes('medieval')
  ) {
    return 'HISTORY';
  }
  if (
    combined.includes('geography') ||
    combined.includes('climate') ||
    combined.includes('earth')
  ) {
    return 'GEOGRAPHY';
  }
  if (
    combined.includes('english') ||
    combined.includes('hindi') ||
    combined.includes('language') ||
    combined.includes('grammar') ||
    combined.includes('literature')
  ) {
    return 'LANGUAGE';
  }
  if (
    combined.includes('computer') ||
    combined.includes('programming') ||
    combined.includes('code') ||
    combined.includes('algorithm') ||
    combined.includes('data structure')
  ) {
    return 'CS';
  }

  return 'DEFAULT';
}

// Ultra-fast prompt builder
function buildNotesPrompt(
  subject: string,
  chapter: string,
  classLevel: string,
  subjectType: keyof typeof SUBJECT_PROMPTS
): string {
  const basePrompt = SUBJECT_PROMPTS[subjectType];

  return `${basePrompt}

CONTEXT:
- Subject: ${subject}
- Chapter: ${chapter}
- Class/Level: ${classLevel}
- Generate notes suitable for this class level

Generate notes IMMEDIATELY in the standardized structure. No fluff, pure value.`;
}

// Parse AI response into structured notes
function parseNotesResponse(response: string): NotesSection {
  try {
    // Try to extract JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        quickOverview: parsed.quickOverview || '',
        keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
        detailedExplanation: parsed.detailedExplanation || '',
        examplesAndApplications: Array.isArray(parsed.examplesAndApplications)
          ? parsed.examplesAndApplications
          : [],
        formulasAndFacts: Array.isArray(parsed.formulasAndFacts)
          ? parsed.formulasAndFacts
          : [],
        examTipsAndTraps: Array.isArray(parsed.examTipsAndTraps)
          ? parsed.examTipsAndTraps
          : [],
        quickRevision: parsed.quickRevision || '',
      };
    }
  } catch (e) {
    console.error('Failed to parse notes JSON', e);
  }

  // Fallback parsing
  return {
    quickOverview: response.substring(0, 200),
    keyConcepts: ['Key concepts not properly parsed'],
    detailedExplanation: response.substring(200, 500),
    examplesAndApplications: [],
    formulasAndFacts: [],
    examTipsAndTraps: [],
    quickRevision: 'Review the content above',
  };
}

// Calculate estimated read time
function calculateReadTime(notes: NotesSection): number {
  const totalText =
    notes.quickOverview +
    notes.keyConcepts.join(' ') +
    notes.detailedExplanation +
    notes.examplesAndApplications.join(' ') +
    (notes.formulasAndFacts?.join(' ') || '') +
    notes.examTipsAndTraps.join(' ') +
    notes.quickRevision;

  // Average reading speed: 200 words per minute
  const wordCount = totalText.split(/\s+/).length;
  return Math.ceil(wordCount / 200);
}

export const notesGeneratorService = {
  /**
   * Generate ultra-fast notes for any subject
   */
  async generateNotes(
    subject: string,
    chapter: string,
    classLevel: string = 'High School'
  ): Promise<SubjectNotes> {
    const subjectType = detectSubjectType(subject, chapter);
    const prompt = buildNotesPrompt(subject, chapter, classLevel, subjectType);

    try {
      // Call Supabase Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ultra-notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt,
            subject,
            chapter,
            classLevel,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate notes: ${response.statusText}`);
      }

      const data = await response.json();
      const notes = parseNotesResponse(data.notes);
      const readTime = calculateReadTime(notes);

      return {
        subject,
        chapter,
        class: classLevel,
        notes,
        generatedAt: new Date(),
        estimatedReadTime: readTime,
      };
    } catch (error) {
      console.error('Notes generation error:', error);
      throw error;
    }
  },

  /**
   * Generate notes for multiple topics quickly
   */
  generateMultipleNotes(
    topics: Array<{ subject: string; chapter: string; class?: string }>
  ): Promise<SubjectNotes[]> {
    return Promise.all(
      topics.map((topic) =>
        this.generateNotes(topic.subject, topic.chapter, topic.class)
      )
    );
  },

  /**
   * Get quick summary without full notes
   */
  async getQuickSummary(subject: string, chapter: string): Promise<string> {
    const notes = await this.generateNotes(subject, chapter);
    return notes.notes.quickRevision;
  },

  /**
   * Detect subject type (exported for testing)
   */
  detectSubjectType,
};
