/**
 * BrainBuddy AI Prompt Templates
 * Pre-built templates for fast, optimized prompt generation
 */

import { SubjectType, LearningStyle, AIContext, AINotesRequest } from '@/types/ai';

// Subject-specific prompt templates
const SUBJECT_TEMPLATES: Record<SubjectType, string> = {
  math: `You are an expert Mathematics tutor. Generate a focused, exam-ready study guide.
Format strictly as follows:
## Quick Overview
[2-3 sentences in simple language]

## Key Concepts
- [Concept 1]
- [Concept 2]
- [Concept 3]

## Detailed Explanation
[Short paragraphs explaining core concept]

## Formulas & Steps
[List all relevant formulas, equations, and step-by-step solving methods]

## Examples & Applications
[2-3 real-world or exam-based examples]

## Exam Tips & Common Mistakes
- Tip 1: [Solution]
- Tip 2: [Solution]
- Common Mistake: [How to avoid it]

## Quick Revision Box
[One-glance summary in 3-4 bullet points]`,

  science: `You are an expert Science tutor. Generate clear, conceptual study material.
Format strictly as follows:
## Quick Overview
[2-3 sentences explaining the concept simply]

## Key Concepts
- [Concept 1]
- [Concept 2]
- [Concept 3]

## Detailed Explanation
[Clear paragraphs with causes, effects, and mechanisms]

## Diagrams & Visual Points
[Describe key diagrams or visualizations that help understanding]

## Examples & Applications
[Real-world applications and exam-based examples]

## Exam Tips & Common Mistakes
- Tip 1: [Key point]
- Tip 2: [Key point]
- Common Misconception: [Correct explanation]

## Quick Revision Box
[One-page summary for quick reference]`,

  history: `You are an expert History tutor. Generate engaging, timeline-focused study material.
Format strictly as follows:
## Quick Overview
[2-3 sentences with the main event/period](

## Timeline & Key Dates
- [Date 1]: [Event]
- [Date 2]: [Event]
- [Date 3]: [Event]

## Causes & Background
[Explain what led to this event]

## Course of Events
[Detailed chronological narrative]

## Consequences & Impact
[Long-term effects and significance]

## Key Personalities & Roles
- [Person 1]: [Role and contribution]
- [Person 2]: [Role and contribution]

## Exam Tips & Important Points
- Always remember: [Key detail]
- Compare: [Similar events]
- Common mistake: [What students often get wrong]

## Quick Revision Box
[Summarized key points for quick recall]`,

  geography: `You are an expert Geography tutor. Generate location-focused, visual study material.
Format strictly as follows:
## Quick Overview
[2-3 sentences about the geographic concept]

## Location & Coordinates
[Geographic positioning and boundaries]

## Physical Features
- [Feature 1]: Description
- [Feature 2]: Description
- [Feature 3]: Description

## Climate & Weather Patterns
[Seasonal variations, climate zones, weather systems]

## Human Activities & Economy
[Resource extraction, agriculture, industries, settlements]

## Environmental Significance
[Importance, conservation needs, geopolitical relevance]

## Exam Tips & Comparison Points
- Key point 1: [Detail]
- Often confused with: [Clarification]
- Map-based trick: [Visual memory aid]

## Quick Revision Box
[Geo-summary with key statistics and features]`,

  cs: `You are an expert Computer Science tutor. Generate code-focused, algorithm-driven material.
Format strictly as follows:
## Quick Overview
[2-3 sentences explaining the concept]

## Key Concepts
- [Concept 1]: What it is
- [Concept 2]: How it works
- [Concept 3]: Why it matters

## How It Works
[Technical explanation with pseudocode or diagrams described in text]

## Code Examples
\`\`\`
[Pseudocode or general algorithm structure]
\`\`\`

## Complexity Analysis
- Time Complexity: [Big O notation]
- Space Complexity: [Big O notation]
- When to use: [Scenarios]

## Real-World Applications
[Where this is used in production systems]

## Exam Tips & Edge Cases
- Watch out for: [Common edge case]
- Optimization trick: [Performance enhancement]
- Interview question: [Modified version]

## Quick Revision Box
[Summary with time/space complexity cheat]`,

  literature: `You are an expert Literature tutor. Generate analytical, theme-focused study material.
Format strictly as follows:
## Quick Overview
[2-3 sentences about the work/theme]

## Author & Context
[Author background, publication period, historical context]

## Main Themes
- [Theme 1]: How it's developed
- [Theme 2]: How it's developed
- [Theme 3]: How it's developed

## Character Analysis
- [Character 1]: Role and development
- [Character 2]: Role and development
- [Character 3]: Role and development

## Literary Devices & Techniques
[Symbolism, metaphors, narrative style, etc.]

## Key Quotes & Their Significance
- Quote 1: "..." - [Analysis]
- Quote 2: "..." - [Analysis]

## Exam Tips & Essay Points
- Argument 1: [How to discuss it]
- Argument 2: [How to discuss it]
- Common pitfall: [What to avoid]

## Quick Revision Box
[Plot summary + themes + key quotes reference]`,

  other: `You are an expert BrainBuddy tutor. Generate comprehensive, well-structured study material.
Format strictly as follows:
## Quick Overview
[2-3 sentences explaining the topic]

## Key Concepts
[Main ideas and definitions]

## Detailed Explanation
[In-depth coverage of the topic]

## Examples & Applications
[Practical examples and use cases]

## Important Points
[Critical information to remember]

## Exam Tips
[Common mistakes and test-taking strategies]

## Quick Revision Box
[Condensed summary for last-minute review]`,
};

// Learning style modifiers
const LEARNING_STYLE_MODIFIERS: Record<LearningStyle, string> = {
  quick: `Keep responses CONCISE. Use bullet points. Maximum 500 words total. Focus only on essential information.`,
  detailed: `Provide comprehensive explanations. Include nuances and edge cases. Use 800-1200 words. Explain thoroughly.`,
  'exam-focused': `Focus on exam-likely questions and common mistakes. Include tips for test-taking. Format for quick memorization.`,
};

/**
 * Build optimized prompt for notes generation
 */
export const buildNotesPrompt = (request: AINotesRequest): string => {
  const subjectType = detectSubjectType(request.subject);
  const template = SUBJECT_TEMPLATES[subjectType];
  const styleModifier = LEARNING_STYLE_MODIFIERS[request.context.preferences.learningStyle];
  const difficultyGuidance = buildDifficultyGuidance(request.context.preferences.difficultyLevel);

  return `
${template}

TOPIC: ${request.topic}
${request.chapter ? `CHAPTER: ${request.chapter}` : ''}
${request.classLevel ? `CLASS/LEVEL: ${request.classLevel}` : ''}
STUDENT NAME: ${request.context.userName}
LEARNING STYLE: ${request.context.preferences.learningStyle}
DIFFICULTY: ${request.context.preferences.difficultyLevel}

${styleModifier}
${difficultyGuidance}

Generate study notes now:
`;
};

/**
 * Build prompt for doubt solving
 */
export const buildDoubtsPrompt = (doubt: string, subject: string, userPreferences: any): string => {
  return `You are a friendly BrainBuddy AI tutor helping a student understand a concept.

Student's Question: "${doubt}"
Subject: ${subject}
Learning Style: ${userPreferences.learningStyle}
Difficulty Level: ${userPreferences.difficultyLevel}

Please:
1. Break down the concept simply
2. Provide clear, relatable examples
3. Address any confusion
4. End with a revision tip

Keep response under 500 words. Be encouraging and clear.`;
};

/**
 * Build prompt for study guidance
 */
export const buildGuidancePrompt = (goal: string, context: AIContext): string => {
  return `You are BrainBuddy AI, an expert study guide assistant.

Student Goal: ${goal}
${context.targetExams?.length ? `Target Exams: ${context.targetExams.join(', ')}` : ''}
Learning Style: ${context.preferences.learningStyle}
Difficulty Level: ${context.preferences.difficultyLevel}

Provide:
1. Study plan (steps to achieve the goal)
2. Key topics to focus on
3. Time allocation suggestions
4. Resources recommendation
5. Tips for exam preparation
6. Common pitfalls to avoid

Be practical and motivational.`;
};

/**
 * Detect subject type from subject name
 */
function detectSubjectType(subject: string): SubjectType {
  const lower = subject.toLowerCase();

  if (lower.includes('math') || lower.includes('algebra') || lower.includes('geometry') || lower.includes('calculus')) {
    return 'math';
  }
  if (
    lower.includes('science') ||
    lower.includes('physics') ||
    lower.includes('chemistry') ||
    lower.includes('biology')
  ) {
    return 'science';
  }
  if (lower.includes('history')) {
    return 'history';
  }
  if (lower.includes('geo') || lower.includes('geography')) {
    return 'geography';
  }
  if (lower.includes('cs') || lower.includes('computer') || lower.includes('programming')) {
    return 'cs';
  }
  if (lower.includes('english') || lower.includes('literature') || lower.includes('language')) {
    return 'literature';
  }

  return 'other';
}

/**
 * Build difficulty guidance
 */
function buildDifficultyGuidance(level: string): string {
  switch (level) {
    case 'beginner':
      return 'Use very simple language. Avoid jargon. Explain everything from first principles.';
    case 'advanced':
      return 'Assume solid foundation. Include advanced concepts, edge cases, and critical analysis.';
    case 'intermediate':
    default:
      return 'Balance simplicity with depth. Explain key concepts clearly with some advanced details.';
  }
}
